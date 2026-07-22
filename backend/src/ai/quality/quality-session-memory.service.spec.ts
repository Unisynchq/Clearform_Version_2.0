import { QualitySessionMemoryService } from './quality-session-memory.service';
import type { QualityResult } from '../ai.service.types';

describe('QualitySessionMemoryService', () => {
  const formId = 'form-1';
  const sessionId = 'session-abc';

  const store = new Map<string, string>();
  const redis = {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
      return 'OK';
    }),
  };

  let service: QualitySessionMemoryService;

  const amber = (message: string, suggestions: string[]): QualityResult => ({
    level: 'amber',
    message,
    failedIds: ['specificity'],
    suggestions,
  });

  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
    service = new QualitySessionMemoryService(redis as never);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('roundtrips shown messages, suggestions, verdicts, and violations', async () => {
    await service.recordResult({
      formId,
      sessionId,
      screenId: 2,
      result: amber('too vague', ['name the step']),
      violationKind: 'low_value',
    });
    const session = await service.load(formId, sessionId);
    const screen = session!.screens['2'];
    expect(screen.verdicts).toEqual(['amber']);
    expect(screen.shownMessages).toEqual(['too vague']);
    expect(screen.shownSuggestions).toEqual(['name the step']);
    expect(screen.violations.low_value).toBe(1);
    expect(session!.totals.low_value).toBe(1);
  });

  it('writes with the 2h TTL', async () => {
    await service.recordResult({
      formId,
      sessionId,
      screenId: 1,
      result: amber('m', []),
    });
    expect(redis.set).toHaveBeenCalledWith(
      `ai:qsession:${formId}:${sessionId}`,
      expect.any(String),
      'EX',
      7200,
    );
  });

  it('caps per-screen history lengths', async () => {
    for (let i = 0; i < 10; i += 1) {
      await service.recordResult({
        formId,
        sessionId,
        screenId: 1,
        result: amber(`message ${i}`, [`suggestion ${i}`]),
      });
    }
    const screen = (await service.load(formId, sessionId))!.screens['1'];
    expect(screen.verdicts).toHaveLength(5);
    expect(screen.shownSuggestions).toHaveLength(6);
    expect(screen.shownMessages).toHaveLength(4);
  });

  it('caps tracked screens at 20 (drop oldest)', async () => {
    for (let i = 0; i < 25; i += 1) {
      await service.recordResult({
        formId,
        sessionId,
        screenId: i,
        result: amber('m', []),
      });
    }
    const session = await service.load(formId, sessionId);
    const ids = Object.keys(session!.screens);
    expect(ids).toHaveLength(20);
    expect(ids).not.toContain('0');
    expect(ids).toContain('24');
  });

  it('falls back to in-memory storage when Redis is down', async () => {
    redis.set.mockRejectedValue(new Error('down'));
    redis.get.mockRejectedValue(new Error('down'));
    await service.recordResult({
      formId,
      sessionId,
      screenId: 1,
      result: amber('m', ['s']),
    });
    const session = await service.load(formId, sessionId);
    expect(session!.screens['1'].shownSuggestions).toEqual(['s']);
  });

  it('screenDigest changes as history accumulates and is undefined without history', async () => {
    expect(service.screenDigest(null, 1)).toBeUndefined();
    await service.recordResult({
      formId,
      sessionId,
      screenId: 1,
      result: amber('m1', ['s1']),
    });
    const s1 = await service.load(formId, sessionId);
    const d1 = service.screenDigest(s1, 1);
    expect(service.screenDigest(s1, 99)).toBeUndefined();
    await service.recordResult({
      formId,
      sessionId,
      screenId: 1,
      result: amber('m2', ['s2']),
    });
    const s2 = await service.load(formId, sessionId);
    expect(service.screenDigest(s2, 1)).not.toBe(d1);
  });
});
