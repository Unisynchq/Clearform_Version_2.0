import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Header,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EntitlementsGuard } from '../billing/entitlements/entitlements.guard';
import { RequiresEntitlement } from '../billing/entitlements/requires-entitlement.decorator';

@Controller('api/v1/analytics/forms')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':formId/performance')
  @Header('Cache-Control', 'private, max-age=60')
  getPerformance(
    @Param('formId') formId: string,
    @Query('range') range: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getAnalytics(formId, user.id, range);
  }

  @Get(':formId/overview')
  @Header('Cache-Control', 'private, max-age=60')
  getOverview(
    @Param('formId') formId: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getOverview(formId, user.id);
  }

  @Get(':formId/responses')
  getResponses(
    @Param('formId') formId: string,
    @Query('page') page: string,
    @Query('range') range: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getResponses(
      formId,
      user.id,
      page ? parseInt(page, 10) : 1,
      range,
    );
  }

  @Get(':formId/compare')
  @Header('Cache-Control', 'private, max-age=60')
  compare(
    @Param('formId') formId: string,
    @Query('range') range: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getCompare(formId, user.id, range);
  }

  @Get(':formId/response-quality')
  @Header('Cache-Control', 'private, max-age=60')
  getResponseQuality(
    @Param('formId') formId: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getResponseQuality(formId, user.id);
  }

  @Get(':formId/top-responses')
  @Header('Cache-Control', 'private, max-age=120')
  getTopResponses(
    @Param('formId') formId: string,
    @Query('limit') limit: string,
    @Query('minScore') minScore: string,
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getTopResponses(
      formId,
      user.id,
      limit ? Math.min(parseInt(limit, 10), 50) : 5,
      minScore ? parseInt(minScore, 10) : 75,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(EntitlementsGuard)
  @RequiresEntitlement('ai_insights')
  @Post(':formId/ai-insights')
  aiInsights(
    @Param('formId') formId: string,
    @Body() body: { range?: string },
    @CurrentUser() user: any,
  ) {
    return this.analyticsService.getAiInsights(formId, user.id, body?.range);
  }
}
