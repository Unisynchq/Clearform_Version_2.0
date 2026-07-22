import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FormStatus } from '@prisma/client';
import {
  buildPublicFormShortDisplay,
  buildPublicFormUrl,
  slugifyFormTitle,
} from '../common/utils/public-form-url';

@Injectable()
export class ShareService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getShareDetails(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      include: { settings: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form.settings || {};
  }

  async getShareLinks(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
      select: { id: true, title: true, status: true },
    });
    if (!form) throw new NotFoundException('Form not found');

    const origin =
      this.config.get<string>('PUBLIC_FORM_ORIGIN') ?? 'http://localhost:5173';
    const publicUrl = buildPublicFormUrl(origin, formId);
    const shortDisplay = buildPublicFormShortDisplay(origin, formId);
    const slug = slugifyFormTitle(form.title);
    const status = form.status === FormStatus.LIVE ? 'live' : 'draft';

    return {
      formId,
      publicUrl,
      shortDisplay,
      slug,
      status,
      ...(status !== 'live'
        ? { warning: 'Publish your form before sharing the link.' }
        : {}),
    };
  }

  async updateResponseLimit(
    formId: string,
    userId: string,
    responseLimit: number | null,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    return this.prisma.formSettings.upsert({
      where: { formId },
      update: { responseLimit },
      create: { formId, responseLimit },
    });
  }
}
