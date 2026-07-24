import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { BillingEntitlementsService } from '../../billing/entitlements/billing-entitlements.service';

export const PERMISSION_MAP: Record<
  string,
  (plan: {
    aiBundle: boolean;
    responsesLimit: number;
    workspacesLimit: number;
  }) => boolean
> = {
  'form:read': () => true,
  'form:write': () => true,
  'form:delete': () => true,
  'response:read': () => true,
  'response:export': () => true,
  'workspace:create': (plan) => plan.workspacesLimit > 0,
  'workspace:manage': (plan) => plan.workspacesLimit > 0,
  'integration:connect': (plan) => plan.workspacesLimit > 0,
  'ai:use': () => true,
  'ai:pro': (plan) => plan.aiBundle === true,
  'billing:manage': (plan) => plan.aiBundle === true,
  'admin:access': () => false,
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private entitlements: BillingEntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: string } }>();
    const userId = request.user?.id;
    if (!userId) {
      this.logger.warn('Permissions guard: no user ID in request context');
      throw new ForbiddenException('Access denied');
    }

    try {
      const plan = await this.entitlements.getPlanForUser(userId);

      for (const permission of requiredPermissions) {
        const checkFn = PERMISSION_MAP[permission];
        if (!checkFn) {
          this.logger.warn(`Unknown permission: "${permission}"`);
          throw new ForbiddenException('Access denied');
        }
        if (!checkFn(plan)) {
          this.logger.warn(
            `Authorization failure: user ${userId} lacks permission "${permission}"`,
          );
          throw new ForbiddenException('Insufficient permissions');
        }
      }
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(
        `Permissions check failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ForbiddenException('Access denied');
    }
  }
}
