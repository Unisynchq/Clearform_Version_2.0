import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CleoRule {
  id: string;
  rule: string;
  aiDecision: string;
  formArchetype: string;
  correctionCount: number;
  createdAt: string;
}

interface QdrantSearchHit {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
}

const COLLECTION = 'cleo_platform_rules';
const VECTOR_SIZE = 1536;

@Injectable()
export class QdrantMemoryService implements OnModuleInit {
  private readonly logger = new Logger(QdrantMemoryService.name);
  private base: string | null = null;
  private headers: Record<string, string> = { 'Content-Type': 'application/json' };

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('QDRANT_URL')?.trim();
    if (!url) {
      this.logger.log('QDRANT_URL not set — Qdrant memory disabled');
      return;
    }
    this.base = url.replace(/\/$/, '');
    const key = this.config.get<string>('QDRANT_API_KEY')?.trim();
    if (key) this.headers['api-key'] = key;
    await this.ensureCollection();
  }

  get isEnabled(): boolean {
    return this.base !== null;
  }

  async upsertRule(
    id: string,
    vector: number[],
    payload: Omit<CleoRule, 'id'>,
  ): Promise<void> {
    if (!this.base) return;
    await this.put(`/collections/${COLLECTION}/points`, {
      points: [{ id, vector, payload }],
    });
    this.logger.log(
      `Qdrant: upserted rule ${id} (archetype=${payload.formArchetype}, decision=${payload.aiDecision})`,
    );
  }

  async searchSimilar(
    vector: number[],
    filter?: { aiDecision?: string; formArchetype?: string },
    limit = 5,
  ): Promise<CleoRule[]> {
    if (!this.base) return [];

    const must: unknown[] = [];
    if (filter?.aiDecision) {
      must.push({ key: 'aiDecision', match: { value: filter.aiDecision } });
    }
    if (filter?.formArchetype) {
      must.push({ key: 'formArchetype', match: { value: filter.formArchetype } });
    }

    const body: Record<string, unknown> = { vector, limit, with_payload: true };
    if (must.length > 0) body.filter = { must };

    try {
      const data = await this.post(`/collections/${COLLECTION}/points/search`, body);
      return ((data?.result ?? []) as QdrantSearchHit[]).map((hit) => ({
        id: String(hit.id),
        rule: String(hit.payload?.rule ?? ''),
        aiDecision: String(hit.payload?.aiDecision ?? ''),
        formArchetype: String(hit.payload?.formArchetype ?? ''),
        correctionCount: Number(hit.payload?.correctionCount ?? 1),
        createdAt: String(hit.payload?.createdAt ?? ''),
      }));
    } catch (err) {
      this.logger.warn(`Qdrant search failed: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  private async ensureCollection(): Promise<void> {
    try {
      const existing = await this.get(`/collections/${COLLECTION}`);
      if (existing?.result) return;
    } catch {
      // collection doesn't exist, create it
    }
    try {
      await this.put(`/collections/${COLLECTION}`, {
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
      });
      this.logger.log(`Qdrant collection '${COLLECTION}' created`);
    } catch (err) {
      this.logger.error(`Failed to create Qdrant collection: ${err instanceof Error ? err.message : err}`);
      this.base = null;
    }
  }

  private async get(path: string): Promise<Record<string, unknown> | null> {
    const res = await fetch(`${this.base}${path}`, { headers: this.headers });
    if (!res.ok) return null;
    return res.json() as Promise<Record<string, unknown>>;
  }

  private async post(path: string, body: unknown): Promise<Record<string, unknown> | null> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Qdrant POST ${path} → ${res.status}: ${text}`);
    }
    return res.json() as Promise<Record<string, unknown>>;
  }

  private async put(path: string, body: unknown): Promise<void> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Qdrant PUT ${path} → ${res.status}: ${text}`);
    }
  }
}
