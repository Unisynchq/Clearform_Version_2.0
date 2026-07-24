import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Optional managed-memory layer.
 * Pushes Cleo's daily learning summaries to Supermemory so they are
 * accessible via the Supermemory MCP server (https://mcp.supermemory.ai/mcp)
 * for agentic flows without any custom tooling.
 * Silently no-ops when SUPERMEMORY_API_KEY is not configured.
 */
@Injectable()
export class SupermemoryService {
  private readonly logger = new Logger(SupermemoryService.name);
  private readonly base = 'https://api.supermemory.ai/v3';
  private apiKey: string | null = null;

  constructor(private readonly config: ConfigService) {
    this.apiKey =
      this.config.get<string>('SUPERMEMORY_API_KEY')?.trim() ?? null;
    if (!this.apiKey) {
      this.logger.log('SUPERMEMORY_API_KEY not set — Supermemory disabled');
    }
  }

  get isEnabled(): boolean {
    return this.apiKey !== null;
  }

  async addMemory(content: string, tags?: string[]): Promise<void> {
    if (!this.apiKey) return;
    try {
      const res = await fetch(`${this.base}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          content,
          ...(tags?.length ? { tags } : {}),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Supermemory add failed: ${res.status} ${text}`);
      } else {
        this.logger.log(
          `Supermemory: memory stored (tags=${tags?.join(',') ?? 'none'})`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Supermemory request failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
