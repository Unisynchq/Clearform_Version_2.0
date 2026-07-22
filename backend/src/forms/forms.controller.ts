import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { FormStatus } from '@prisma/client';
import { applyPublicFormCacheHeaders } from './public-form-cache.util';

@Controller('api/v1/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto, @CurrentUser() user: any) {
    return this.formsService.create(createFormDto, user.id);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: FormStatus,
    @Query('workspaceId') workspaceId?: string,
    @Query('search') search?: string,
  ) {
    return this.formsService.findAll(user.id, status, workspaceId, search);
  }

  @Public()
  @Get(':id/render')
  async renderForm(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const render = await this.formsService.renderFormPublic(id);
    applyPublicFormCacheHeaders(res, render);
    return render.snapshot;
  }

  @Public()
  @Get(':id/published')
  async getPublished(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const render = await this.formsService.renderFormPublic(id);
    applyPublicFormCacheHeaders(res, render);
    return render.snapshot;
  }

  @Get(':id/builder-snapshot')
  getSnapshot(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.getSnapshot(id, user.id);
  }

  @Throttle({ default: { limit: 300, ttl: 60_000 } })
  @Put(':id/builder-snapshot')
  saveSnapshot(
    @Param('id') id: string,
    @Body() body: Record<string, unknown> & { version?: number },
    @CurrentUser() user: any,
  ) {
    const { version, ...snapshot } = body;
    return this.formsService.saveSnapshot(
      id,
      snapshot,
      user.id,
      typeof version === 'number' ? version : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
    @CurrentUser() user: any,
  ) {
    return this.formsService.update(id, updateFormDto, user.id);
  }

  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: any,
  ) {
    return this.formsService.publish(id, user.id, body);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.unpublish(id, user.id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.duplicate(id, user.id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.archive(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formsService.remove(id, user.id);
  }
}
