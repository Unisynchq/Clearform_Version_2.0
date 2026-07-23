import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationSseService } from './notification-sse.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: NotificationSseService,
  ) {}

  async create(data: {
    userId: string;
    formId?: string;
    responseId?: string;
    type: string;
    title: string;
    body: string;
    action?: Record<string, unknown> | null;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        action: (data.action ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    this.sse.emit(data.userId, 'notification', notification);
    return notification;
  }

  async listForUser(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    const unreadCount = await this.countUnread(userId);
    this.sse.emit(userId, 'unread_count', { count: unreadCount });
    return result;
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    this.sse.emit(userId, 'unread_count', { count: 0 });
    return result;
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async deleteAll(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    this.sse.emit(userId, 'unread_count', { count: 0 });
    return result;
  }
}
