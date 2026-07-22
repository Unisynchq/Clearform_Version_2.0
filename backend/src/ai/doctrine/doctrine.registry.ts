import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import type { Redis } from 'ioredis';
import { safeRedisGet, safeRedisSet } from '../../redis/redis-cache.util';
import type { FormArchetype } from '../form-context.types';
import type { QuestionIntent } from '../question-intent/question-intent.types';

export type DoctrineTask =
  | 'response-quality'
  | 'logic-generation'
  | 'insights'
  | 'overview'
  | 'improve-instructions'
  | 'best-responses';

/** Runtime doctrine lives beside this file — shipped with the AI module, not under docs/. */
const DOCTRINE_ROOT = __dirname;

const CORE_FILES = ['platform.md', 'scale.md'] as const;

const POLICY_FILES = ['policies/respondent-conduct.md'] as const;

const NUDGE_TASK_FILES = ['tasks/response-quality-nudges.md'] as const;

const SIGNAL_FILES = ['signals/red.md', 'signals/amber.md', 'signals/green.md'] as const;

const CONTEXT_FILES = [
  'context/multi-part-questions.md',
  'context/form-purpose-coaching.md',
  'context/respondent-voice.md',
] as const;

const IMPROVE_CONTEXT_FILES = [
  'context/form-purpose-coaching.md',
] as const;

const INTENT_FILES: Record<QuestionIntent, string> = {
  identity: 'intents/identity.md',
  factual_short: 'intents/factual-short.md',
  yes_no: 'intents/factual-short.md',
  open_feedback: 'intents/open-feedback.md',
  experience_narrative: 'intents/experience-narrative.md',
  achievement: 'intents/achievement.md',
  optional_topic: 'intents/optional-topic.md',
  generic: 'intents/generic.md',
};

const ARCHETYPE_FILES: Record<FormArchetype, string | null> = {
  generic: null,
  'internal-team-review': 'archetypes/internal-team-review.md',
  'customer-nps': 'archetypes/customer-nps.md',
  'academic-research': 'archetypes/academic-research.md',
  'community-club': 'archetypes/community-club.md',
  'founder-product-discovery': 'archetypes/founder-product-discovery.md',
};

const TASK_FILES: Record<DoctrineTask, string> = {
  'response-quality': 'tasks/response-quality.md',
  'logic-generation': 'tasks/logic-generation.md',
  insights: 'tasks/insights.md',
  overview: 'tasks/overview.md',
  'improve-instructions': 'tasks/improve-instructions.md',
  'best-responses': 'tasks/best-responses.md',
};

function readDoctrineFile(relativePath: string): string {
  const full = join(DOCTRINE_ROOT, relativePath);
  if (!existsSync(full)) {
    return '';
  }
  return readFileSync(full, 'utf8').trim();
}

function loadConstitution(): string {
  return readDoctrineFile('constitution.md');
}

@Injectable()
export class DoctrineRegistry implements OnModuleInit {
  private readonly logger = new Logger(DoctrineRegistry.name);
  private versionHash = '';
  private readonly cache = new Map<string, string>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    this.refreshCache();
    const { setDefaultOwnerPromptRegistry } = await import(
      '../quality/default-owner-quality-prompt'
    );
    setDefaultOwnerPromptRegistry(this);
    const redisKey = 'ai:doctrine:version';
    const prior = await safeRedisGet(this.redis, redisKey);
    if (prior !== this.versionHash) {
      await safeRedisSet(this.redis, redisKey, this.versionHash);
      if (prior) {
        this.logger.log(
          `Doctrine version changed ${prior.slice(0, 8)} → ${this.versionHash.slice(0, 8)}`,
        );
      }
    }
  }

  getVersion(): string {
    return this.versionHash;
  }

  getConstitution(): string {
    return loadConstitution();
  }

  getIntentDoctrine(intent: QuestionIntent): string {
    const cacheKey = `intent:${intent}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;
    const body = readDoctrineFile(INTENT_FILES[intent] ?? INTENT_FILES.generic);
    this.cache.set(cacheKey, body);
    return body;
  }

  getDefaultOwnerGuidanceBlock(): string {
    const cacheKey = 'defaults:owner-quality';
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;
    const body = readDoctrineFile('defaults/owner-quality-defaults.md');
    this.cache.set(cacheKey, body);
    return body;
  }

  /**
   * Slim system prompt for live keystroke eval — constitution + signals + intent + task.
   */
  getDoctrineSlim(
    task: DoctrineTask,
    intent: QuestionIntent = 'generic',
  ): string {
    const cacheKey = `slim:${task}:${intent}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    const parts: string[] = [loadConstitution()];
    if (task === 'response-quality') {
      for (const file of SIGNAL_FILES) {
        const body = readDoctrineFile(file);
        if (body) parts.push(body);
      }
      for (const file of CONTEXT_FILES) {
        const body = readDoctrineFile(file);
        if (body) parts.push(body);
      }
      for (const file of [...POLICY_FILES, ...NUDGE_TASK_FILES]) {
        const body = readDoctrineFile(file);
        if (body) parts.push(body);
      }
      const intentBody = readDoctrineFile(
        INTENT_FILES[intent] ?? INTENT_FILES.generic,
      );
      if (intentBody) parts.push(intentBody);
    }
    // Improve-with-AI must share the same Green/Amber/Red yardstick as live coaching.
    if (task === 'improve-instructions') {
      for (const file of SIGNAL_FILES) {
        const body = readDoctrineFile(file);
        if (body) parts.push(body);
      }
      for (const file of IMPROVE_CONTEXT_FILES) {
        const body = readDoctrineFile(file);
        if (body) parts.push(body);
      }
      const intentBody = readDoctrineFile(
        INTENT_FILES[intent] ?? INTENT_FILES.generic,
      );
      if (intentBody) parts.push(intentBody);
      const defaults = this.getDefaultOwnerGuidanceBlock();
      if (defaults) parts.push(defaults);
    }
    const taskBody = readDoctrineFile(TASK_FILES[task]);
    if (taskBody) parts.push(taskBody);

    const composed = parts.join('\n\n---\n\n');
    this.cache.set(cacheKey, composed);
    return composed;
  }

  getDoctrine(task: DoctrineTask, archetype: FormArchetype = 'generic'): string {
    const cacheKey = `${task}:${archetype}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    const parts: string[] = [loadConstitution()];

    for (const file of CORE_FILES) {
      const body = readDoctrineFile(file);
      if (body) parts.push(body);
    }

    const archetypeFile = ARCHETYPE_FILES[archetype];
    if (archetypeFile) {
      const body = readDoctrineFile(archetypeFile);
      if (body) parts.push(body);
    }

    const taskBody = readDoctrineFile(TASK_FILES[task]);
    if (taskBody) parts.push(taskBody);

    const composed = parts.join('\n\n---\n\n');
    this.cache.set(cacheKey, composed);
    return composed;
  }

  private refreshCache(): void {
    this.cache.clear();
    const digest = createHash('sha256');
    digest.update(loadConstitution());
    for (const file of [
      ...CORE_FILES,
      ...POLICY_FILES,
      ...NUDGE_TASK_FILES,
      ...SIGNAL_FILES,
      ...CONTEXT_FILES,
      ...Object.values(INTENT_FILES),
      'defaults/owner-quality-defaults.md',
      'context/evaluation-envelope.md',
      ...Object.values(TASK_FILES),
      ...(Object.values(ARCHETYPE_FILES).filter(Boolean) as string[]),
    ]) {
      digest.update(readDoctrineFile(file));
    }
    this.versionHash = digest.digest('hex');
  }
}
