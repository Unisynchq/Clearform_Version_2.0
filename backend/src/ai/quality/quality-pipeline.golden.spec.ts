import { HttpException } from '@nestjs/common';
import { AiOrchestratorService } from '../ai-orchestrator.service';
import type { EvaluateQualityDto, QualityResult } from '../ai.service.types';

const DEFAULT_LLM_JSON = JSON.stringify({
  level: 'amber',
  message: 'Add a bit more detail so this is easier to act on.',
  failedIds: ['specificity'],
  suggestions: ['Name the step or moment that mattered most.'],
});

const HOSTILE_LLM_JSON = JSON.stringify({
  level: 'red',
  message: 'This sounds hostile — please answer the question respectfully.',
  failedIds: ['hostile'],
  suggestions: ['Share what you want to improve about the experience.'],
});

describe('executeQuality golden fixtures', () => {
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  };
  const formContext = {
    buildForQualityOnly: jest.fn(),
    buildForForm: jest.fn(),
  };
  const doctrine = {
    getDoctrineSlim: jest.fn().mockReturnValue('SYSTEM DOCTRINE'),
    getDoctrine: jest.fn().mockReturnValue('SYSTEM DOCTRINE'),
    getIntentDoctrine: jest.fn().mockReturnValue('INTENT DOCTRINE'),
    getVersion: jest.fn().mockReturnValue('v-test'),
  };
  const memory = { retrieveSimilar: jest.fn().mockResolvedValue([]) };
  const grounding = {
    validate: jest.fn().mockReturnValue({ ok: true }),
    validateQualityResult: jest.fn().mockReturnValue({ ok: true }),
  };
  const llm = {
    isConfigured: jest.fn().mockReturnValue(true),
    completion: jest.fn().mockResolvedValue(DEFAULT_LLM_JSON),
  };
  const prisma = {};
  const cleo = {};
  const questionIntent = {
    classify: jest.fn().mockResolvedValue('generic'),
  };
  const sessionMemory = {
    load: jest.fn().mockResolvedValue(null),
    recordResult: jest.fn().mockResolvedValue(undefined),
    screenDigest: jest.fn().mockReturnValue(undefined),
  };

  const service = () =>
    new AiOrchestratorService(
      formContext as never,
      doctrine as never,
      memory as never,
      grounding as never,
      llm as never,
      prisma as never,
      cleo as never,
      questionIntent as never,
      sessionMemory as never,
      redis as never,
    );

  const baseDto: EvaluateQualityDto = {
    screenId: '2',
    fieldId: 'short-text',
    questionText: 'What could we improve about your onboarding experience?',
    helperText: '',
  };

  const run = (dto: Partial<EvaluateQualityDto>, intent = 'generic') => {
    questionIntent.classify.mockResolvedValue(intent);
    return service().executeQuality(undefined, { ...baseDto, ...dto } as never);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    memory.retrieveSimilar.mockResolvedValue([]);
    llm.isConfigured.mockReturnValue(true);
    llm.completion.mockResolvedValue(DEFAULT_LLM_JSON);
    grounding.validateQualityResult.mockReturnValue({ ok: true });
  });

  const snap = (result: QualityResult) => ({
    level: result.level,
    message: result.message,
    failedIds: result.failedIds,
    suggestions: result.suggestions ?? null,
    followUpQuestion: result.followUpQuestion ?? null,
  });

  it('throws when LLM gateway is not configured', async () => {
    llm.isConfigured.mockReturnValue(false);
    await expect(run({ text: 'hello' })).rejects.toBeInstanceOf(HttpException);
  });

  it('empty answer → red without LLM', async () => {
    expect(snap(await run({ text: '' }))).toMatchSnapshot();
    expect(llm.completion).not.toHaveBeenCalled();
  });

  it('pure gibberish → static red safety gate', async () => {
    expect(snap(await run({ text: 'dfdfdfdfdfdfdfdfdf' }))).toMatchSnapshot();
    expect(llm.completion).not.toHaveBeenCalled();
  });

  it('hostile answer → single doctrine LLM eval', async () => {
    llm.completion.mockResolvedValue(HOSTILE_LLM_JSON);
    const out = await run({
      text: 'dont have to change anything so stay out of my way okay !!',
    });
    expect(llm.completion).toHaveBeenCalled();
    expect(out.level).toBe('red');
  });

  it('short vague answer → quality LLM', async () => {
    const out = await run({ text: 'it was good' });
    expect(llm.completion).toHaveBeenCalled();
    expect(out.level).toBe('amber');
  });

  it('substantive answer → quality LLM green', async () => {
    llm.completion.mockResolvedValue(
      JSON.stringify({
        level: 'green',
        message: 'Naming the email-code delay makes this easy to act on.',
        failedIds: [],
        suggestions: [],
      }),
    );
    const out = await run({
      text: 'The signup email code took four tries to arrive and the profile setup lost my answers when I pressed back.',
    });
    expect(out.level).toBe('green');
  });

  it('name answer uses quality LLM', async () => {
    llm.completion.mockResolvedValue(
      JSON.stringify({
        level: 'green',
        message: 'Thanks — a full name is exactly what this asks for.',
        failedIds: [],
        suggestions: [],
      }),
    );
    const out = await run(
      { questionText: 'What is your full name?', text: 'Abbubakar Sheikh' },
      'identity',
    );
    expect(llm.completion).toHaveBeenCalledTimes(1);
    expect(out.level).toBe('green');
  });

  it('cache hit returns cached verdict', async () => {
    const cached: QualityResult = {
      level: 'green',
      message: 'cached message',
      failedIds: [],
    };
    redis.get.mockResolvedValue(JSON.stringify(cached));
    expect(await run({ text: 'anything' })).toEqual({
      ...cached,
      meta: { source: 'cache', tier: 'free' },
    });
    expect(llm.completion).not.toHaveBeenCalled();
  });
});
