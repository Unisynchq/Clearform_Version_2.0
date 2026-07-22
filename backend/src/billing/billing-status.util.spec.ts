import { enrichBillingStatus } from './billing-status.util';
import { FREE_PLAN, PILOT_35_PLAN } from '../config/plans';

describe('enrichBillingStatus', () => {
  it('keeps free users on the free AI tier with trial features', () => {
    const status = enrichBillingStatus(
      {
        planId: FREE_PLAN.id,
        status: 'FREE',
        responsesUsed: 0,
        responsesLimit: FREE_PLAN.responsesLimit,
        formsUsed: 0,
        formsLimit: FREE_PLAN.formsLimit,
        workspacesUsed: 0,
        workspacesLimit: FREE_PLAN.workspacesLimit,
        periodEnd: null,
        expiresAt: null,
        source: null,
      },
      { effectivePlanId: FREE_PLAN.id, pilotActive: false },
    );

    expect(status.aiTier).toBe('free');
    expect(status.aiCredits.limit).toBe(FREE_PLAN.ai.aiCreditsLimit);
    expect(status.aiTokens?.limit).toBe(FREE_PLAN.ai.aiCreditsLimit);
    expect(status.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ai_credits', included: true }),
        expect.objectContaining({ id: 'ai_logic_trial', included: true }),
      ]),
    );
  });

  it('exposes pro AI tier and pilot features for active Pilot users', () => {
    const status = enrichBillingStatus(
      {
        planId: PILOT_35_PLAN.id,
        status: 'ACTIVE',
        responsesUsed: 12,
        responsesLimit: PILOT_35_PLAN.responsesLimit,
        formsUsed: 2,
        formsLimit: PILOT_35_PLAN.formsLimit,
        workspacesUsed: 1,
        workspacesLimit: PILOT_35_PLAN.workspacesLimit,
        periodEnd: new Date('2026-10-01T00:00:00.000Z'),
        expiresAt: new Date('2026-10-01T00:00:00.000Z'),
        source: 'RAZORPAY',
      },
      { effectivePlanId: PILOT_35_PLAN.id, pilotActive: true },
    );

    expect(status.aiTier).toBe('pro');
    expect(status.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ai_quality', included: true }),
        expect.objectContaining({ id: 'ai_insights', included: true }),
        expect.objectContaining({ id: 'ai_logic', included: true }),
      ]),
    );
  });
});
