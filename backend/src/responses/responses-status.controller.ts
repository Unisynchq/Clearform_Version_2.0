import { Controller, Get, Param } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/responses')
export class ResponseStatusController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Get(':responseId/status')
  getStatus(@Param('responseId') responseId: string, @CurrentUser() user: any) {
    return this.responsesService.getStatus(responseId, user.id);
  }
}
