import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  BillingEntitlementsService,
  upgradeRequired,
} from './billing-entitlements.service';
import {
  ENTITLEMENT_KEY,
  EntitlementFeature,
} from './requires-entitlement.decorator';

/**
 * Enforces @RequiresEntitlement() on owner-authenticated routes by checking
 * the acting user's plan capabilities. Routes without the decorator pass.
 */
@Injectable()
export class EntitlementsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: BillingEntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<
      EntitlementFeature | undefined
    >(ENTITLEMENT_KEY, [context.getHandler(), context.getClass()]);
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.id;
    if (!userId) return true; // auth guard owns the 401 path

    if (feature === 'ai_insights') {
      const plan = await this.entitlements.getPlanForUser(userId);
      if (!plan.ai.insightsAccess) {
        throw upgradeRequired(
          'ai_insights',
          'AI insights are part of Clearform Pilot. Upgrade to analyse real answer text with AI.',
        );
      }
    }
    return true;
  }
}
