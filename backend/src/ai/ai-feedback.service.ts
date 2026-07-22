import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAiFeedbackDto {
  screenId?: string;
  /** 1 = correct, -1 = wrong */
  rating: 1 | -1;
  note?: string;
  /** AI's original decision: 'red' | 'amber' | 'green' */
  aiDecision: string;
  actualAnswer?: string;
}

@Injectable()
export class AiFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    formId: string,
    responseId: string,
    userId: string,
    dto: CreateAiFeedbackDto,
  ) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new ForbiddenException('Form not found or access denied');

    const response = await this.prisma.formResponse.findFirst({
      where: { id: responseId, formId },
    });
    if (!response) throw new NotFoundException('Response not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any).aiFeedback.create({
      data: {
        formId,
        responseId,
        screenId: dto.screenId ?? null,
        rating: dto.rating,
        note: dto.note ?? null,
        aiDecision: dto.aiDecision,
        actualAnswer: dto.actualAnswer ?? null,
        createdBy: userId,
      },
    });
  }

  async listForForm(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new ForbiddenException('Form not found or access denied');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any).aiFeedback.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
