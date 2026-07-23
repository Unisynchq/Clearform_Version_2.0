import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('api/v1/forms/:id/webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(@Param('id') formId: string, @CurrentUser() user: any) {
    return this.webhooksService.findAll(formId, user.id);
  }

  @Post()
  async create(
    @Param('id') formId: string,
    @Body() createWebhookDto: CreateWebhookDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.webhooksService.create(formId, user.id, createWebhookDto);
    const name = createWebhookDto.url.split('/').pop() ?? createWebhookDto.url;
    this.notificationsService.create({
      userId: user.id,
      type: 'webhook_connected',
      title: 'Webhook connected',
      body: `${name} connected successfully.`,
    }).catch(() => {});
    return result;
  }

  @Post(':wid/test')
  testWebhook(
    @Param('id') formId: string,
    @Param('wid') webhookId: string,
    @CurrentUser() user: any,
  ) {
    return this.webhooksService.testWebhook(formId, webhookId, user.id);
  }

  @Patch(':wid')
  update(
    @Param('id') formId: string,
    @Param('wid') webhookId: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @CurrentUser() user: any,
  ) {
    return this.webhooksService.update(
      formId,
      webhookId,
      user.id,
      updateWebhookDto,
    );
  }

  @Delete(':wid')
  @HttpCode(204)
  async remove(
    @Param('id') formId: string,
    @Param('wid') webhookId: string,
    @CurrentUser() user: any,
  ) {
    const webhook = await this.webhooksService.remove(formId, webhookId, user.id);
    const name = (webhook as any)?.url?.split('/')?.pop() ?? 'Webhook';
    this.notificationsService.create({
      userId: user.id,
      type: 'webhook_disconnected',
      title: 'Webhook disconnected',
      body: `${name} disconnected successfully.`,
    }).catch(() => {});
  }
}
