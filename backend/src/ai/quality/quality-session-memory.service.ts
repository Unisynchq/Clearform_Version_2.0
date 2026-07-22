import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { REDIS_KEYS, REDIS_TTL } from '../../common/redis-cache-keys';
import type { QualityResult } from '../ai.service.types';
import type { QualityViolationKind } from '../ai-quality-rules.util';

const MAX_SCREENS = 20;
const MAX_VERDICTS = 5;
const MAX_SUGGESTIONS = 6;
const MAX_MESSAGES = 4;
const SUGGESTION_TRUNCATE = 160;
const ANSWER_EXCERPT_TRUNCATE = 200;

export type ScreenSessionMemory = {
  verdicts: Array<QualityResult['level']>;
  shownSuggestions: string[];
  shownMessages: string[];
  violations: Partial<Record<string, number>>;
  /**
   * The answer text evaluated last time (truncated). Verdict labels alone
   * ("amber → red") don't let the LLM compare what actually changed between
   * attempts — this does, so a follow-up suggestion can be grounded in the
   * real delta instead of re-grading cold.
   */
  lastAnswerExcerpt?: string;
};

export type QualitySessionMemory = {
  screens: Record<string, ScreenSessionMemory>;
  totals: Partial<Record<string, number>> & { reds?: number };
  updatedAt: number;
};

function emptySession(): QualitySessionMemory {
  return { screens: {}, totals: {}, updatedAt: Date.now() };
}

function emptyScreen(): ScreenSessionMemory {
  return {
    verdicts: [],
    shownSuggestions: [],
    shownMessages: [],
    violations: {},
    lastAnswerExcerpt: undefined,
  };
}

/**
 * Per-respondent-session memory of what the quality banner already showed —
 * the state that makes anti-repeat and conversational callbacks ("random
 * characters again") possible on an unauthenticated public form. Redis-backed
 * with the same in-memory degradation as FormAiRateLimitService.
 */
@Injectable()
export class QualitySessionMemoryService implements OnModuleDestroy {
  private readonly logger = new Logger(QualitySessionMemoryService.name);
  private readonly memory = new Map<
    string,
    { data: QualitySessionMemory; expiresAt: number }
  >();
  private readonly sweepTimer: ReturnType<typeof setInterval>;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    this.sweepTimer = setInterval(() => this.sweepExpired(), 10 * 60 * 1000);
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.sweepTimer);
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key);
    }
  }

  async load(
    formId: string,
    sessionId: string,
  ): Promise<QualitySessionMemory | null> {
    const key = REDIS_KEYS.aiQualitySession(formId, sessionId);
    try {
      const raw = await this.redis.get(key);
      if (raw) return JSON.parse(raw) as QualitySessionMemory;
      return null;
    } catch {
      const entry = this.memory.get(key);
      return entry && entry.expiresAt > Date.now() ? entry.data : null;
    }
  }

  async recordResult(opts: {
    formId: string;
    sessionId: string;
    screenId: string | number;
    result: QualityResult;
    violationKind?: QualityViolationKind;
    answerText?: string;
  }): Promise<void> {
    const { formId, sessionId, screenId, result, violationKind, answerText } =
      opts;
    const key = REDIS_KEYS.aiQualitySession(formId, sessionId);
    const session = (await this.load(formId, sessionId)) ?? emptySession();
    const screenKey = String(screenId);

    if (
      !session.screens[screenKey] &&
      Object.keys(session.screens).length >= MAX_SCREENS
    ) {
      // Drop the least-recently-touched screen (insertion order approximates it).
      const oldest = Object.keys(session.screens)[0];
      delete session.screens[oldest];
    }
    const screen = session.screens[screenKey] ?? emptyScreen();

    screen.verdicts = [...screen.verdicts, result.level].slice(-MAX_VERDICTS);
    if (typeof answerText === 'string' && answerText.trim()) {
      screen.lastAnswerExcerpt = answerText.trim().slice(0, ANSWER_EXCERPT_TRUNCATE);
    }
    if (result.message) {
      screen.shownMessages = dedupePush(
        screen.shownMessages,
        result.message.slice(0, SUGGESTION_TRUNCATE),
        MAX_MESSAGES,
      );
    }
    for (const suggestion of result.suggestions ?? []) {
      screen.shownSuggestions = dedupePush(
        screen.shownSuggestions,
        suggestion.slice(0, SUGGESTION_TRUNCATE),
        MAX_SUGGESTIONS,
      );
    }
    if (violationKind && violationKind !== 'none') {
      screen.violations[violationKind] =
        (screen.violations[violationKind] ?? 0) + 1;
      session.totals[violationKind] = (session.totals[violationKind] ?? 0) + 1;
    }
    if (result.level === 'red') {
      session.totals.reds = (session.totals.reds ?? 0) + 1;
    }

    // Re-insert so iteration order tracks recency for the drop-oldest cap.
    delete session.screens[screenKey];
    session.screens[screenKey] = screen;
    session.updatedAt = Date.now();

    const serialized = JSON.stringify(session);
    try {
      await this.redis.set(
        key,
        serialized,
        'EX',
        REDIS_TTL.aiQualitySessionSeconds,
      );
    } catch (err) {
      this.memory.set(key, {
        data: session,
        expiresAt: Date.now() + REDIS_TTL.aiQualitySessionSeconds * 1000,
      });
      this.logger.warn(
        `Session memory falling back to in-memory: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Short digest of what this screen's session history could change about the
   * output — used to partition the eval cache so a session with history never
   * gets served another session's (or its own pre-history) cached copy.
   */
  screenDigest(
    session: QualitySessionMemory | null,
    screenId: string | number,
  ): string | undefined {
    const screen = session?.screens[String(screenId)];
    if (!screen) return undefined;
    const payload = JSON.stringify({
      s: screen.shownSuggestions,
      m: screen.shownMessages,
      v: screen.verdicts.length,
      k: screen.violations,
    });
    return createHash('sha1').update(payload).digest('hex').slice(0, 10);
  }
}

function dedupePush(list: string[], item: string, max: number): string[] {
  const next = list.filter((existing) => existing !== item);
  next.push(item);
  return next.slice(-max);
}
