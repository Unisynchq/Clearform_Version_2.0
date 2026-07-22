import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Request,
  Post,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';
import { NotificationsService } from './notifications.service';
import { ResendWebhookHandler } from './resend-webhook.handler';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly resendWebhook: ResendWebhookHandler,
  ) {}

  @Get()
  list(@Request() req: any, @Query('page') page?: string) {
    return this.notificationsService.listForUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Patch('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Public()
  @Throttle({ strict: { limit: 30, ttl: 60_000 } })
  @Post('resend/webhook')
  resendWebhookEndpoint(
    @Req() req: ExpressRequest & { rawBody?: Buffer },
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing webhook body');
    }
    return this.resendWebhook.handle(Buffer.from(rawBody), {
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
    });
  }
}
