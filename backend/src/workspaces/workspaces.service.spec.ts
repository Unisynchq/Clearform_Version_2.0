import { NotFoundException } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  const userId = 'user-1';
  const workspaceId = 'ws-1';

  const prisma = {
    workspace: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    form: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(async (fn) =>
      fn({
        form: { updateMany: jest.fn() },
        workspace: { delete: jest.fn().mockResolvedValue({ id: workspaceId }) },
      }),
    ),
  };

  const billingService = {
    assertCanCreateWorkspace: jest.fn(),
  };

  let service: WorkspacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkspacesService(prisma as never, billingService as never);
  });

  describe('remove', () => {
    it('throws when workspace not found', async () => {
      prisma.workspace.findFirst.mockResolvedValue(null);
      await expect(service.remove(workspaceId, userId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('unlinks forms and deletes workspace in a transaction', async () => {
      prisma.workspace.findFirst.mockResolvedValue({ id: workspaceId });
      const txFormUpdate = jest.fn();
      const txWorkspaceDelete = jest
        .fn()
        .mockResolvedValue({ id: workspaceId });
      prisma.$transaction.mockImplementation(async (fn) =>
        fn({
          form: { updateMany: txFormUpdate },
          workspace: { delete: txWorkspaceDelete },
        }),
      );

      await service.remove(workspaceId, userId);

      expect(txFormUpdate).toHaveBeenCalledWith({
        where: { workspaceId, ownerId: userId },
        data: { workspaceId: null },
      });
      expect(txWorkspaceDelete).toHaveBeenCalledWith({
        where: { id: workspaceId },
      });
    });
  });
});
