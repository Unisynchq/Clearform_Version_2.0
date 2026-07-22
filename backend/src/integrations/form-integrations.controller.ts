import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from './integrations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * Handoff B.8 lists form-scoped integration routes; connections remain workspace-scoped.
 */
@Controller('api/v1/forms/:formId/integrations')
export class FormIntegrationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  @Get()
  async list(
    @Param('formId') formId: string,
    @CurrentUser() user: { id: string },
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: user.id },
      select: { workspaceId: true },
    });
    if (!form?.workspaceId) {
      throw new NotFoundException('Form not found');
    }
    return this.integrationsService.list(form.workspaceId, user.id, formId);
  }

  /**
   * Handoff B.8 — update workspace integration while scoped to a form (body.integrationId required).
   */
  @Patch()
  async updateForForm(
    @Param('formId') formId: string,
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      integrationId: string;
      composioEntityId?: string;
      metadata?: Record<string, unknown>;
      active?: boolean;
    },
  ) {
    if (!body?.integrationId?.trim()) {
      throw new BadRequestException('integrationId is required');
    }
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: user.id },
      select: { workspaceId: true },
    });
    if (!form?.workspaceId) {
      throw new NotFoundException('Form not found');
    }
    const { integrationId, ...data } = body;
    return this.integrationsService.update(
      integrationId.trim(),
      form.workspaceId,
      user.id,
      data,
    );
  }

  /** Creates a dedicated Google Sheet for this form and stores the spreadsheetId on the connection. */
  @Post('google-sheets/create-sheet')
  async createSheet(
    @Param('formId') formId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.integrationsService.createFormSheet(formId, user.id);
  }

  /** Creates a dedicated Notion database for this form and stores the databaseId on the connection. */
  @Post('notion/create-database')
  async createNotionDatabase(
    @Param('formId') formId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { parentPageId: string },
  ) {
    if (!body?.parentPageId?.trim()) {
      throw new BadRequestException('parentPageId is required');
    }
    return this.integrationsService.createFormNotionDatabase(
      formId,
      user.id,
      body.parentPageId.trim(),
    );
  }
}
