import { LlmGatewayService } from './llm-gateway.service';

describe('LlmGatewayService hardening', () => {
  const env: Record<string, string> = {};
  const config = { get: jest.fn((key: string) => env[key]) };
  const gemini = {
    isEnabled: jest.fn().mockReturnValue(false),
    handlesTask: jest.fn().mockReturnValue(false),
    completion: jest.fn(),
  };
  const prisma = { aiCallLog: { create: jest.fn().mockResolvedValue({}) } };
  const redisStore = new Map<string, string>();
  const redis = {
    get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
    incrbyfloat: jest.fn(async (key: string, amount: number) => {
      const next = Number(redisStore.get(key) ?? '0') + amount;
      redisStore.set(key, String(next));
      return String(next);
    }),
    expire: jest.fn().mockResolvedValue(1),
  };

  let service: LlmGatewayService;
  let fetchMock: jest.SpyInstance;

  const options = {
    task: 'fast' as const,
    tier: 'free' as const,
    messages: [{ role: 'user' as const, content: 'hello world' }],
    timeoutMs: 50,
    maxFallbackModels: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
    for (const key of Object.keys(env)) delete env[key];
    env.OPENROUTER_API_KEY = 'test-key';
    service = new LlmGatewayService(
      config as never,
      gemini as never,
      prisma as never,
      redis as never,
    );
    fetchMock = jest.spyOn(globalThis, 'fetch' as never);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  const failingFetch = () =>
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'boom',
    });

  it('opens the provider circuit after 5 consecutive failures and skips the rung', async () => {
    failingFetch();
    for (let i = 0; i < 5; i += 1) {
      await service.completion(options);
    }
    const callsBefore = fetchMock.mock.calls.length;
    expect(callsBefore).toBe(5);

    // Circuit open: the next completion must not hit the network at all.
    const result = await service.completion(options);
    expect(result).toBeNull();
    expect(fetchMock.mock.calls.length).toBe(callsBefore);
  });

  it('records failed attempts with an estimated prompt cost', async () => {
    // Pro tier goes straight to Gemini (paid model, so cost tracking is non-zero).
    gemini.isEnabled.mockReturnValue(true);
    gemini.completion.mockResolvedValue({
      ok: false,
      model: 'gemini-2.5-flash',
      error: 'boom',
    });
    await service.completion({ ...options, tier: 'pro' });
    expect(prisma.aiCallLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          success: false,
          tier: 'pro',
          provider: 'gemini',
        }),
      }),
    );
    // Spend keys incremented despite failure.
    expect(redis.incrbyfloat).toHaveBeenCalledWith(
      expect.stringMatching(/^ai:spend:\d{4}-\d{2}-\d{2}$/),
      expect.any(Number),
    );
    expect(redis.incrbyfloat).toHaveBeenCalledWith(
      expect.stringMatching(/^ai:spend:tier:pro:/),
      expect.any(Number),
    );
  });

  it('pro tier never falls back to OpenRouter when Gemini is disabled', async () => {
    gemini.isEnabled.mockReturnValue(false);
    failingFetch();
    const result = await service.completion({ ...options, tier: 'pro' });
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('free tier prefers OpenRouter and skips Gemini when OpenRouter succeeds', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5 },
      }),
    });
    gemini.isEnabled.mockReturnValue(true);
    const result = await service.completion(options);
    expect(result).toBe('ok');
    expect(gemini.completion).not.toHaveBeenCalled();
  });

  it('free tier falls back to Gemini flash-lite when OpenRouter fails', async () => {
    failingFetch();
    gemini.isEnabled.mockReturnValue(true);
    gemini.completion.mockResolvedValue({
      ok: true,
      model: 'gemini-2.5-flash-lite',
      content: 'grounded tip',
      promptTokens: 10,
      outputTokens: 8,
    });
    const result = await service.completion(options);
    expect(result).toBe('grounded tip');
    expect(gemini.completion).toHaveBeenCalled();
    expect(prisma.aiCallLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          success: true,
          tier: 'free',
          provider: 'gemini',
          model: 'gemini-2.5-flash-lite',
        }),
      }),
    );
  });

  it('free OpenRouter success path still works', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: { prompt_tokens: 5, completion_tokens: 5 },
      }),
    });
    const result = await service.completion(options);
    expect(result).toBe('ok');
    expect(gemini.completion).not.toHaveBeenCalled();
  });
});
