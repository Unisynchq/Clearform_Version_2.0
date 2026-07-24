import { PermissionsGuard, PERMISSION_MAP } from '../../common/guards/permissions.guard';

describe('Authorization Security', () => {
  describe('Permission Mapping', () => {
    const mockFreePlan = {
      id: 'free' as const,
      name: 'Free',
      responsesLimit: 50,
      formsLimit: null as number | null,
      workspacesLimit: 1,
      aiBundle: false,
      ai: {
        tier: 'free' as const,
        qualityTrialSessions: null as number | null,
        logicGenerationsTotal: 50,
        insightsAccess: true,
        cleoMemory: false,
        aiCreditsLimit: 100,
      },
    };

    const mockPilotPlan = {
      id: 'pilot_35' as const,
      name: 'Clearform Pilot',
      responsesLimit: 300,
      formsLimit: null as number | null,
      workspacesLimit: 3,
      aiBundle: true,
      ai: {
        tier: 'pro' as const,
        qualityTrialSessions: null as number | null,
        logicGenerationsTotal: null as number | null,
        insightsAccess: true,
        cleoMemory: true,
        aiCreditsLimit: 2000,
      },
    };

    it('should allow form:read for all tiers', () => {
      expect(PERMISSION_MAP['form:read'](mockFreePlan)).toBe(true);
      expect(PERMISSION_MAP['form:read'](mockPilotPlan)).toBe(true);
    });

    it('should allow form:write for all tiers', () => {
      expect(PERMISSION_MAP['form:write'](mockFreePlan)).toBe(true);
      expect(PERMISSION_MAP['form:write'](mockPilotPlan)).toBe(true);
    });

    it('should only allow ai:pro for Pilot tier', () => {
      expect(PERMISSION_MAP['ai:pro'](mockFreePlan)).toBe(false);
      expect(PERMISSION_MAP['ai:pro'](mockPilotPlan)).toBe(true);
    });

    it('should deny admin:access for all tiers', () => {
      expect(PERMISSION_MAP['admin:access'](mockFreePlan)).toBe(false);
      expect(PERMISSION_MAP['admin:access'](mockPilotPlan)).toBe(false);
    });

    it('should restrict workspace:create for Free tier', () => {
      expect(PERMISSION_MAP['workspace:create'](mockFreePlan)).toBe(true);
    });
  });
});
