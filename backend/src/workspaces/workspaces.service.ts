import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userId: string) {
    await this.billingService.assertCanCreateWorkspace(userId);
    const colour = createWorkspaceDto.colour ?? createWorkspaceDto.color;
    const ws = await this.prisma.workspace.create({
      data: {
        label: createWorkspaceDto.label,
        colour: colour ?? null,
        ownerId: userId,
      },
    });
    return { ...ws, color: ws.colour, count: 0 };
  }

  async findAll(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { forms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map _count.forms to a flat formsCount property if desired, or return as is.
    return workspaces.map(({ _count, ...ws }) => ({
      ...ws,
      color: ws.colour,
      count: _count.forms,
    }));
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
    userId: string,
  ) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, ownerId: userId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const { color, colour, label } = updateWorkspaceDto;
    const finalColour = colour ?? color;
    const data: Record<string, any> = {};
    if (label !== undefined) data.label = label;
    if (finalColour !== undefined) data.colour = finalColour;

    return this.prisma.workspace.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, ownerId: userId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.form.updateMany({
        where: { workspaceId: id, ownerId: userId },
        data: { workspaceId: null },
      });
      return tx.workspace.delete({
        where: { id },
      });
    });
  }
}
