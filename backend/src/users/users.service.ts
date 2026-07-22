import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { MailService } from '../notifications/mail.service';

export interface FirebaseUserPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Idempotent sync for Firebase-authenticated users (uid = User.id).
   * Safe under parallel requests (create + P2002 retry).
   */
  async findOrCreateFromFirebase(payload: FirebaseUserPayload): Promise<User> {
    const { id, email, firstName, lastName } = payload;

    const existingById = await this.findById(id);
    if (existingById) {
      return this.maybeBackfillOnboarding(existingById);
    }

    const existingByEmail = await this.findByEmail(email);
    if (existingByEmail) {
      if (existingByEmail.id === id) {
        return this.maybeBackfillOnboarding(existingByEmail);
      }
      return this.linkLegacyUserToFirebaseUid(existingByEmail, payload);
    }

    try {
      const created = await this.prisma.user.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          passwordHash: '',
        },
      });
      void this.sendWelcomeEmail(created);
      return this.maybeBackfillOnboarding(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const retry = await this.findById(id);
        if (retry) return this.maybeBackfillOnboarding(retry);
        const byEmail = await this.findByEmail(email);
        if (byEmail) {
          if (byEmail.id === id) return this.maybeBackfillOnboarding(byEmail);
          return this.linkLegacyUserToFirebaseUid(byEmail, payload);
        }
      }
      throw error;
    }
  }

  async deleteById(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      avatarUrl?: string | null;
    },
  ): Promise<User> {
    const patch: Prisma.UserUpdateInput = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (data.email !== undefined) patch.email = data.email;
    if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl;
    return this.prisma.user.update({
      where: { id: userId },
      data: patch,
    });
  }

  async markOnboardingComplete(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
  }

  async exportAccountCsv(userId: string): Promise<string> {
    const forms = await this.prisma.form.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: { select: { responses: { where: { status: { not: 'ABANDONED' as any } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const header = 'formId,formTitle,totalResponses,createdAt';
    const rows = forms.map((f) =>
      [
        escape(f.id),
        escape(f.title),
        escape(f._count.responses),
        escape(f.createdAt.toISOString()),
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: { select: { planId: true, status: true } },
        _count: { select: { forms: true } },
      },
    });
  }

  private async maybeBackfillOnboarding(user: User): Promise<User> {
    if (user.onboardingCompletedAt) return user;

    const formCount = await this.prisma.form.count({
      where: { ownerId: user.id },
    });
    if (formCount === 0) return user;

    return this.prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompletedAt: user.createdAt },
    });
  }

  /**
   * Legacy JWT users (auto uuid id) signing in with Firebase — re-key to Firebase uid when safe.
   */
  private async linkLegacyUserToFirebaseUid(
    legacy: User,
    payload: FirebaseUserPayload,
  ): Promise<User> {
    const { id: firebaseUid, firstName, lastName, email } = payload;

    const formCount = await this.prisma.form.count({
      where: { ownerId: legacy.id },
    });
    const workspaceCount = await this.prisma.workspace.count({
      where: { ownerId: legacy.id },
    });

    if (formCount > 0 || workspaceCount > 0) {
      this.logger.warn(
        `Firebase uid ${firebaseUid} matches email ${email} but legacy user ${legacy.id} has data — updating profile fields only`,
      );
      return this.prisma.user.update({
        where: { id: legacy.id },
        data: { firstName, lastName },
      });
    }

    const collision = await this.findById(firebaseUid);
    if (collision) return this.maybeBackfillOnboarding(collision);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: legacy.id } });
      const created = await tx.user.create({
        data: {
          id: firebaseUid,
          email,
          firstName,
          lastName,
          passwordHash: '',
          onboardingCompletedAt: legacy.onboardingCompletedAt,
        },
      });
      void this.sendWelcomeEmail(created);
      return created;
    });
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    try {
      await this.mail.sendWelcomeSignInEmail({
        userId: user.id,
        toEmail: user.email,
        toName: user.firstName || 'there',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Welcome email skipped for ${user.email}: ${message}`);
    }
  }
}
