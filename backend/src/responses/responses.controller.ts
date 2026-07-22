import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  Inject,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Throttle } from '@nestjs/throttler';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { ResponsesService } from './responses.service';
import { ResponseFileStorageService } from './response-file-storage.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { normalizeCreateResponseBody } from './create-response-payload.util';
import { sanitizeAnswersByScreenId } from './sanitize-response-uploads.util';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { REDIS_CLIENT } from '../redis/redis.constants';
import {
  hotPreviewFromPayload,
  pushRecentResponseToHotCache,
} from './response-hot-cache.util';
import { BillingService } from '../billing/billing.service';

@Controller('api/v1/forms/:id/responses')
export class ResponsesController {
  constructor(
    private readonly responsesService: ResponsesService,
    private readonly responseFileStorage: ResponseFileStorageService,
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    @InjectQueue('responses') private readonly responseQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async create(
    @Param('id') formId: string,
    @Body() body: CreateResponseDto & { includePreview?: boolean },
  ) {
    await this.responsesService.validateSubmission(formId);

    const { payload: rawPayload, submittedAt } = normalizeCreateResponseBody(
      body as unknown as Record<string, unknown>,
    );
    const payload = sanitizeAnswersByScreenId(rawPayload);

    const completed =
      payload.completed === true || payload.status === 'completed';
    const durationMs =
      typeof payload.metadata === 'object' &&
      payload.metadata !== null &&
      typeof (payload.metadata as Record<string, unknown>).durationMs ===
        'number'
        ? ((payload.metadata as Record<string, unknown>).durationMs as number)
        : undefined;

    const formSnapshot = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { publishedSnapshot: true, builderSnapshot: true },
    });
    const snapshot =
      formSnapshot?.publishedSnapshot ?? formSnapshot?.builderSnapshot ?? null;

    const dropOffFieldId =
      !completed && payload.abandonedAtScreenId
        ? String(payload.abandonedAtScreenId)
        : undefined;

    if (completed) {
      await this.billingService.assertCanAcceptResponse(formId);
    }

    const created = await this.prisma.formResponse.create({
      data: {
        formId,
        payload: payload as Prisma.InputJsonValue,
        createdAt: new Date(submittedAt),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (completed ? 'PROCESSED' : 'ABANDONED') as any,
        completedAt: completed ? new Date(submittedAt) : null,
        durationMs,
        ...(dropOffFieldId ? { dropOffFieldId } : {}),
      },
      select: {
        id: true,
        formId: true,
        payload: true,
        status: true,
        qualityScore: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Abandoned sessions skip side-effects (no webhooks, notifications, quality scoring).
    if (!completed) {
      return { status: 'accepted', responseId: created.id };
    }

    await this.billingService.incrementResponsesUsedForForm(formId);

    const preview = await pushRecentResponseToHotCache(
      this.redis,
      formId,
      created,
      snapshot,
    );

    await this.responseQueue.add(
      'process-side-effects',
      {
        responseId: created.id,
        formId,
        payload,
        submittedAt,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );

    const includePreview =
      body.includePreview === true ||
      String(process.env.RESPONSE_INCLUDE_PREVIEW ?? '').toLowerCase() ===
        'true';

    return {
      status: 'queued',
      responseId: created.id,
      message: 'Response saved; side effects processing in background.',
      ...(includePreview
        ? {
            preview:
              preview ??
              hotPreviewFromPayload(
                created.id,
                formId,
                payload,
                submittedAt,
                snapshot,
              ),
          }
        : {}),
    };
  }

  @Public()
  @Post('files')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadResponseFile(
    @Param('id') formId: string,
    @UploadedFile()
    file?: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname?: string;
    },
  ) {
    await this.responsesService.validateFormForFileUpload(formId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required.');
    }

    return this.responseFileStorage.uploadResponseFile(
      formId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
  }

  @Get()
  findAll(
    @Param('id') formId: string,
    @Query('page') page: string,
    @Query('range') range: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.responsesService.findAllPaginated(
      formId,
      user.id,
      page ? parseInt(page, 10) : 1,
      range,
    );
  }

  @Get('export')
  async exportResponses(
    @Param('id') formId: string,
    @Query('format') format: string,
    @Query('range') range: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    const fmt = (format ?? 'csv').toLowerCase();
    if (fmt === 'xlsx') {
      const buf = await this.responsesService.exportXlsx(formId, user.id, range);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="responses-${formId}.xlsx"`,
      );
      res.send(buf);
    } else {
      const csv = await this.responsesService.exportCsv(formId, user.id, range);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="responses-${formId}.csv"`,
      );
      res.send(csv);
    }
  }

  @Get(':responseId')
  findOne(
    @Param('id') formId: string,
    @Param('responseId') responseId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.responsesService.findOne(formId, responseId, user.id);
  }
}
