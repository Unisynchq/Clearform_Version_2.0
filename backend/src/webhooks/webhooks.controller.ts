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

@Controller('api/v1/forms/:id/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  findAll(@Param('id') formId: string, @CurrentUser() user: any) {
    return this.webhooksService.findAll(formId, user.id);
  }

  @Post()
  create(
    @Param('id') formId: string,
    @Body() createWebhookDto: CreateWebhookDto,
    @CurrentUser() user: any,
  ) {
    return this.webhooksService.create(formId, user.id, createWebhookDto);
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
  remove(
    @Param('id') formId: string,
    @Param('wid') webhookId: string,
    @CurrentUser() user: any,
  ) {
    return this.webhooksService.remove(formId, webhookId, user.id);
  }
}
