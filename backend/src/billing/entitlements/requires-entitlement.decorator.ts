import { SetMetadata } from '@nestjs/common';

export const ENTITLEMENT_KEY = 'requiresEntitlement';

/** Plan capabilities enforceable by EntitlementsGuard on owner routes. */
export type EntitlementFeature = 'ai_insights';

/**
 * Gate an owner-authenticated route on a plan capability. Routes that resolve
 * a *form owner* (rather than the acting user) or are public call
 * AiEntitlementsService directly instead.
 */
export const RequiresEntitlement = (feature: EntitlementFeature) =>
  SetMetadata(ENTITLEMENT_KEY, feature);
