import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';

interface SSEClient {
  userId: string;
  res: Response;
}

@Injectable()
export class NotificationSseService {
  private readonly logger = new Logger(NotificationSseService.name);
  private clients = new Map<string, SSEClient[]>();

  addClient(userId: string, res: Response): void {
    const existing = this.clients.get(userId) ?? [];
    existing.push({ userId, res });
    this.clients.set(userId, existing);

    res.on('close', () => this.removeClient(userId, res));
  }

  private removeClient(userId: string, res: Response): void {
    const existing = this.clients.get(userId) ?? [];
    const filtered = existing.filter((c) => c.res !== res);
    if (filtered.length === 0) {
      this.clients.delete(userId);
    } else {
      this.clients.set(userId, filtered);
    }
  }

  emit(userId: string, event: string, data: unknown): void {
    const clients = this.clients.get(userId);
    if (!clients?.length) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      try {
        client.res.write(payload);
      } catch (err) {
        this.logger.warn(`SSE write failed for user ${userId}: ${err}`);
        this.removeClient(userId, client.res);
      }
    }
  }

  emitToAll(event: string, data: unknown): void {
    for (const [userId] of this.clients) {
      this.emit(userId, event, data);
    }
  }
}
