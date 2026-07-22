export type PlanFeatureDto = {
  id: string;
  label: string;
  included: boolean;
};

export type BillingStatusResponse = {
  planId: string;
  planName: string;
  status: string;
  aiTier: 'free' | 'pro';
  periodLabel: string;
  features: PlanFeatureDto[];
  responsesUsed: number;
  responsesLimit: number;
  formsUsed: number;
  formsLimit: number | null;
  workspacesUsed: number;
  workspacesLimit: number;
  periodEnd: Date | null;
  expiresAt: Date | null;
  source: 'RAZORPAY' | 'PROMO' | null;
  /** Days granted by a just-redeemed promo code (redeem response only). */
  trialDays?: number;
  /** Finite AI credit wallet — always concrete numbers (product actions). */
  aiCredits: {
    used: number;
    limit: number;
    remaining: number;
    periodLabel: string;
  };
  /** @deprecated Alias of aiCredits for one-release FE compatibility. */
  aiTokens?: {
    used: number;
    limit: number;
    remaining: number;
    periodLabel: string;
  };
  receipt?: {
    paymentId: string;
    purchasedAt: Date;
    amount: number;
    currency: string;
  };
  entitlements?: BillingEntitlementsDto;
};

export type BillingEntitlementsDto = {
  workspaces: { used: number; limit: number; frozenWorkspaceIds: string[] };
  aiTrial: {
    logic: { used: number; limit: number | null };
    qualitySessions: { used: number; limit: number | null };
  };
};
