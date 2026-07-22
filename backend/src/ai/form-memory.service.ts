import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LlmGatewayService } from './llm-gateway.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import type { Redis } from 'ioredis';
import { safeRedisGet, safeRedisSet } from '../redis/redis-cache.util';
import { REDIS_KEYS, REDIS_TTL } from '../common/redis-cache-keys';

export type MemoryChunkType =
  | 'question_pattern'
  | 'insight_theme'
  | 'logic_pattern'
  | 'quality_feedback'
  | 'archetype_note';

export type RetrievedMemoryChunk = {
  id: string;
  chunkType: MemoryChunkType;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
};

export type MemoryRetrieveFilters = {
  screenId?: string | number;
  chunkTypes?: MemoryChunkType[];
};

@Injectable()
export class FormMemoryService {
  private readonly logger = new Logger(FormMemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmGatewayService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async storeChunk(
    formId: string,
    chunkType: MemoryChunkType,
    content: string,
    metadata?: Record<string, unknown>,
    // Kept on the public signature for callers; embeddings no longer branch by tier.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tier: import('./ai-tier.service').AiTier = 'free',
  ): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    const embedding = await this.embedWithCache(formId, trimmed);
    if (!embedding) {
      this.logger.debug(
        `Skipping memory store — embedding unavailable formId=${formId}`,
      );
      return;
    }

    const vectorLiteral = `[${embedding.join(',')}]`;
    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO form_memory_chunks (id, "formId", "chunkType", content, embedding, metadata, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, $5::jsonb, NOW())`,
        formId,
        chunkType,
        trimmed.slice(0, 4000),
        vectorLiteral,
        metadataJson,
      );
    } catch (err) {
      this.logger.warn(
        `form_memory_chunks insert failed (table may be missing): ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async retrieveSimilar(
    formId: string,
    query: string,
    limit = 5,
    // Kept on the public signature for callers; embeddings no longer branch by tier.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tier: import('./ai-tier.service').AiTier = 'free',
    filters?: MemoryRetrieveFilters,
  ): Promise<RetrievedMemoryChunk[]> {
    const embedding = await this.embedWithCache(formId, query);
    if (!embedding) return [];

    const vectorLiteral = `[${embedding.join(',')}]`;
    const chunkTypes = filters?.chunkTypes?.length ? filters.chunkTypes : null;
    const screenId =
      filters?.screenId != null ? String(filters.screenId) : null;

    try {
      type Row = {
        id: string;
        chunkType: string;
        content: string;
        metadata: Record<string, unknown> | null;
        similarity: number;
      };

      const conditions = [`"formId" = $2`, `embedding IS NOT NULL`];
      const params: unknown[] = [vectorLiteral, formId, limit];
      let paramIdx = 4;

      if (chunkTypes?.length) {
        conditions.push(`"chunkType" = ANY($${paramIdx}::text[])`);
        params.push(chunkTypes);
        paramIdx += 1;
      }

      if (screenId) {
        conditions.push(`metadata->>'screenId' = $${paramIdx}`);
        params.push(screenId);
        paramIdx += 1;
      }

      params[2] = limit;

      const rows = await this.prisma.$queryRawUnsafe<Row[]>(
        `SELECT id, "chunkType", content, metadata,
                1 - (embedding <=> $1::vector) AS similarity
         FROM form_memory_chunks
         WHERE ${conditions.join(' AND ')}
         ORDER BY embedding <=> $1::vector
         LIMIT $3`,
        ...params,
      );
      return rows.map((r) => ({
        id: r.id,
        chunkType: r.chunkType as MemoryChunkType,
        content: r.content,
        metadata: r.metadata,
        similarity: Number(r.similarity),
      }));
    } catch (err) {
      this.logger.debug(
        `form_memory_chunks query failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  private async embedWithCache(
    formId: string,
    text: string,
  ): Promise<number[] | null> {
    const hash = createHash('sha256').update(text).digest('hex').slice(0, 16);
    const cacheKey = REDIS_KEYS.embeddingCache(formId, hash);
    const cached = await safeRedisGet(this.redis, cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as number[];
      } catch {
        /* fall through */
      }
    }

    const embedding = await this.llm.embed(text);
    if (embedding) {
      await safeRedisSet(
        this.redis,
        cacheKey,
        JSON.stringify(embedding),
        REDIS_TTL.embeddingCacheSeconds,
      );
    }
    return embedding;
  }
}
