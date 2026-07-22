import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { safeRedisGet, safeRedisSet } from '../../redis/redis-cache.util';
import { LlmGatewayService } from '../llm-gateway.service';
import type { EvaluateQualityDto } from '../ai.service.types';
import type { FormContext } from '../form-context.types';
import type { AiTier } from '../ai-tier.service';
import type { QuestionIntent } from './question-intent.types';
import {
  isExperienceOrFeedbackQuestion,
  normalizeQuestionText,
} from '../quality/question-signals.util';

const INTENT_CACHE_TTL_SEC = 300;

function isNameIntentQuestion(questionText?: string): boolean {
  const q = (questionText ?? '').toLowerCase();
  return /\b(name|full name|first name|last name|your name)\b/.test(q);
}

function isAchievementIntentQuestion(questionText?: string): boolean {
  const q = (questionText ?? '').toLowerCase();
  return /\b(achievement|accomplish|impact|measurable|outcome|contribution|professional|significant)\b/.test(
    q,
  );
}

function isExperienceQuestion(questionText?: string): boolean {
  return isExperienceOrFeedbackQuestion(questionText);
}

function isOptionalTopicQuestion(
  questionText?: string,
  helperText?: string,
): boolean {
  const q = (questionText ?? '').toLowerCase();
  const h = (helperText ?? '').toLowerCase();
  if (/\boptional\b/.test(h)) return true;
  return /\b(any(thing)? else|topics?|explore further|other (ideas|comments|feedback)|additional)\b/.test(
    q,
  );
}

function isOpenFeedbackQuestion(questionText?: string): boolean {
  const q = normalizeQuestionText(questionText);
  return (
    /\b(tell me about|about yourself|introduce yourself|share your story)\b/.test(
      q,
    ) || /\b(describe your .+ in detail|describe .+ experience)\b/.test(q)
  );
}

function isYesNoQuestion(questionText?: string, fieldType?: string): boolean {
  if (fieldType === 'yes_no' || fieldType === 'boolean') return true;
  const q = (questionText ?? '').toLowerCase();
  return /^(do you|did you|are you|is this|have you|would you)\b/.test(q);
}

function isFactualShortQuestion(questionText?: string, fieldType?: string): boolean {
  if (
    fieldType === 'email' ||
    fieldType === 'phone' ||
    fieldType === 'contact' ||
    fieldType === 'date' ||
    fieldType === 'time'
  ) {
    return true;
  }
  const q = (questionText ?? '').toLowerCase();
  if (/\b(email|phone|city|country|age|zip|postal|address)\b/.test(q)) {
    return true;
  }
  // Quantity / duration questions (job apps, surveys) — not narrative feedback.
  if (/\b(how many|number of|count of|total)\b/.test(q)) return true;
  if (/\b(years?|months?)\b.*\b(experience|exp|relevant|professional|work)\b/.test(q)) {
    return true;
  }
  if (/\b(years?|months?)\b.*\b(of|in)\b.*\b(role|field|industry|position|category)\b/.test(q)) {
    return true;
  }
  return false;
}

@Injectable()
export class QuestionIntentService {
  private readonly logger = new Logger(QuestionIntentService.name);

  constructor(
    private readonly llm: LlmGatewayService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  classifyHeuristic(
    dto: EvaluateQualityDto,
    fieldType?: string,
  ): QuestionIntent {
    if (isNameIntentQuestion(dto.questionText)) return 'identity';
    if (isYesNoQuestion(dto.questionText, fieldType)) return 'yes_no';
    if (isFactualShortQuestion(dto.questionText, fieldType)) return 'factual_short';
    if (isOptionalTopicQuestion(dto.questionText, dto.helperText)) {
      return 'optional_topic';
    }
    if (isAchievementIntentQuestion(dto.questionText)) return 'achievement';
    if (isExperienceQuestion(dto.questionText)) return 'experience_narrative';
    if (isOpenFeedbackQuestion(dto.questionText)) return 'open_feedback';
    return 'generic';
  }

  async classify(
    dto: EvaluateQualityDto,
    context: FormContext | null,
    tier: AiTier = 'free',
  ): Promise<QuestionIntent> {
    const screenId = dto.screenId ?? 'anon';
    const formId = context?.formId ?? 'anon';
    const cacheKey = `ai:intent:${formId}:${screenId}`;
    const cached = await safeRedisGet(this.redis, cacheKey);
    if (cached && this.isIntent(cached)) {
      return cached;
    }

    const fieldType = context?.screens.find(
      (s) => String(s.screenId) === String(dto.screenId),
    )?.fieldType;

    const heuristic = this.classifyHeuristic(dto, fieldType);
    if (heuristic !== 'generic') {
      await safeRedisSet(this.redis, cacheKey, heuristic, INTENT_CACHE_TTL_SEC);
      return heuristic;
    }

    const text = (dto.text ?? dto.answerText ?? '').trim();
    const tokens = text.split(/\s+/).filter(Boolean).length;
    if (tokens < 3 || !this.llm.isConfigured()) {
      await safeRedisSet(this.redis, cacheKey, heuristic, INTENT_CACHE_TTL_SEC);
      return heuristic;
    }

    try {
      const content = await this.llm.completion({
        task: 'fast',
        tier,
        messages: [
          {
            role: 'system',
            content:
              'Classify survey question intent. Return JSON only: {"intent":"identity"|"factual_short"|"open_feedback"|"experience_narrative"|"achievement"|"optional_topic"|"yes_no"|"generic"}',
          },
          {
            role: 'user',
            content: `questionText: ${dto.questionText ?? ''}\nhelperText: ${dto.helperText ?? ''}`,
          },
        ],
        maxTokens: 60,
        temperature: 0,
        jsonMode: true,
        timeoutMs: 4000,
        deadlineMs: 5000,
        maxFallbackModels: 1,
      });
      const match = content?.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { intent?: string };
        if (parsed.intent && this.isIntent(parsed.intent)) {
          await safeRedisSet(
            this.redis,
            cacheKey,
            parsed.intent,
            INTENT_CACHE_TTL_SEC,
          );
          return parsed.intent;
        }
      }
    } catch (err) {
      this.logger.warn(
        `Intent LLM classify skipped: ${err instanceof Error ? err.message : err}`,
      );
    }

    await safeRedisSet(this.redis, cacheKey, heuristic, INTENT_CACHE_TTL_SEC);
    return heuristic;
  }

  private isIntent(value: string): value is QuestionIntent {
    return [
      'identity',
      'factual_short',
      'open_feedback',
      'experience_narrative',
      'achievement',
      'optional_topic',
      'yes_no',
      'generic',
    ].includes(value);
  }
}
