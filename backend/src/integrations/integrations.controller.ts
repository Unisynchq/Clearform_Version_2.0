import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from './integrations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/workspaces/:workspaceId/integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    // Task 7.2 — inject PrismaService for form-in-workspace cross-check
    private readonly prisma: PrismaService,
  ) {}

  // Task 11.1 — pass optional ?formId to service for health.spreadsheetConfigured context
  @Get()
  list(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string },
    @Query('formId') formId?: string,
  ) {
    return this.integrationsService.list(
      workspaceId,
      user.id,
      formId?.trim() || undefined,
    );
  }

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      provider: string;
      composioEntityId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.integrationsService.create(workspaceId, user.id, body);
  }

  /** Initiates Composio OAuth for a provider — returns { redirectUrl } */
  @Post(':provider/connect')
  connect(
    @Param('workspaceId') workspaceId: string,
    @Param('provider') provider: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.integrationsService.initiateConnect(
      workspaceId,
      user.id,
      provider,
    );
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      composioEntityId?: string;
      metadata?: Record<string, unknown>;
      active?: boolean;
    },
  ) {
    return this.integrationsService.update(id, workspaceId, user.id, body);
  }

  @Delete(':id')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.integrationsService.remove(id, workspaceId, user.id);
  }

  /** Append a test row to verify Google Sheets connectivity. */
  @Post(':id/test-sheet')
  testSheet(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { formId?: string },
  ) {
    return this.integrationsService.testSheet(
      workspaceId,
      id,
      user.id,
      body?.formId,
    );
  }

  /** Append all stored responses for a form into the connected sheet. */
  @Post(':id/sync-historical')
  syncHistorical(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { formId: string },
  ) {
    if (!body?.formId?.trim()) {
      throw new BadRequestException('formId is required');
    }
    return this.integrationsService.syncHistoricalToSheets(
      workspaceId,
      id,
      user.id,
      body.formId.trim(),
    );
  }

  // Task 7.2 — auto-create a dedicated Google Sheet for a specific form
  @Post(':connectionId/create-form-sheet')
  async createFormSheet(
    @Param('workspaceId') workspaceId: string,
    @Param('connectionId') _connectionId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { formId: string },
  ) {
    if (!body?.formId?.trim()) {
      throw new BadRequestException('formId is required');
    }
    const trimmedFormId = body.formId.trim();

    // Cross-check: formId must belong to this workspace (R1.3)
    const form = await this.prisma.form.findFirst({
      where: { id: trimmedFormId, workspaceId },
      select: { id: true },
    });
    if (!form) {
      throw new NotFoundException('Form not found in this workspace');
    }

    return this.integrationsService.createFormSheet(trimmedFormId, user.id);
  }

  // Auto-create a dedicated Notion database for a specific form (mirrors create-form-sheet)
  @Post(':connectionId/create-form-notion-database')
  async createFormNotionDatabase(
    @Param('workspaceId') workspaceId: string,
    @Param('connectionId') _connectionId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { formId: string; parentPageId: string },
  ) {
    if (!body?.formId?.trim()) {
      throw new BadRequestException('formId is required');
    }
    if (!body?.parentPageId?.trim()) {
      throw new BadRequestException('parentPageId is required');
    }
    const trimmedFormId = body.formId.trim();

    const form = await this.prisma.form.findFirst({
      where: { id: trimmedFormId, workspaceId },
      select: { id: true },
    });
    if (!form) {
      throw new NotFoundException('Form not found in this workspace');
    }

    return this.integrationsService.createFormNotionDatabase(
      trimmedFormId,
      user.id,
      body.parentPageId.trim(),
    );
  }
}
