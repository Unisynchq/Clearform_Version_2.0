import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AiFeedbackService, CreateAiFeedbackDto } from './ai-feedback.service';

@Controller('api/v1/forms/:formId')
export class AiFeedbackController {
  constructor(private readonly aiFeedbackService: AiFeedbackService) {}

  /** Form builder rates an AI quality decision for a specific response. */
  @Post('responses/:responseId/ai-feedback')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  create(
    @Param('formId') formId: string,
    @Param('responseId') responseId: string,
    @Body() body: CreateAiFeedbackDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.aiFeedbackService.create(formId, responseId, user.id, body);
  }

  /** List all AI feedback for a form (for the Cleo learning pipeline). */
  @Get('ai-feedback')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  list(
    @Param('formId') formId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.aiFeedbackService.listForForm(formId, user.id);
  }
}
