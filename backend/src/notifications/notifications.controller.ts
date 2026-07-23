import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Request,
  Post,
  Req,
  Headers,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest, Response } from 'express';
import { NotificationsService } from './notifications.service';
import { NotificationSseService } from './notification-sse.service';
import { ResendWebhookHandler } from './resend-webhook.handler';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sse: NotificationSseService,
    private readonly resendWebhook: ResendWebhookHandler,
  ) {}

  @Get()
  list(@Request() req: any, @Query('page') page?: string) {
    return this.notificationsService.listForUser(
      req.user.id,
      page ? parseInt(page, 10) : 1,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.countUnread(req.user.id);
    return { count };
  }

  @Get('stream')
  stream(@Request() req: any, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    this.sse.addClient(req.user.id, res);

    this.notificationsService.countUnread(req.user.id).then((count) => {
      res.write(`event: unread_count\ndata: ${JSON.stringify({ count })}\n\n`);
    });
  }

  @Patch('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.delete(id, req.user.id);
  }

  @Delete()
  deleteAll(@Request() req: any) {
    return this.notificationsService.deleteAll(req.user.id);
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
