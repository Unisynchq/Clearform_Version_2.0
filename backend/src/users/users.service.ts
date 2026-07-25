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
    const email = data.email ? data.email.trim().toLowerCase() : data.email;
    let username = data.username;
    if (!username && data.firstName) {
      username = await this.generateUsername(`${data.firstName} ${data.lastName || ''}`);
    }
    return this.prisma.user.create({
      data: {
        ...data,
        email,
        username,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email ? email.trim().toLowerCase() : email;
    return this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async generateUsername(displayName: string): Promise<string> {
    let base = displayName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 20);
    if (!base) base = 'user';

    let candidate = base;
    let attempt = 0;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      const suffix = Math.random().toString(36).substring(2, 6);
      candidate = `${base.substring(0, 15)}_${suffix}`;
      attempt++;
      if (attempt > 10) break;
    }
    return candidate;
  }

  async checkEmailAvailable(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !user;
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const normalized = username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { username: normalized },
    });
    return !user;
  }

  /**
   * Idempotent sync for Firebase-authenticated users (uid = User.id).
   * Safe under parallel requests (create + P2002 retry).
   */
  async findOrCreateFromFirebase(payload: FirebaseUserPayload): Promise<User> {
    const id = payload.id;
    const email = payload.email
      ? payload.email.trim().toLowerCase()
      : payload.email;
    const firstName = payload.firstName;
    const lastName = payload.lastName;

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

    const username = await this.generateUsername(`${firstName} ${lastName}`);

    try {
      const created = await this.prisma.user.create({
        data: {
          id,
          email,
          username,
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
    // Soft delete user & cascade delete their forms, responses, notifications
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.form.deleteMany({
        where: { ownerId: userId },
      }),
      this.prisma.notification.deleteMany({
        where: { userId },
      }),
    ]);
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      username?: string;
      timezone?: string;
      avatarUrl?: string | null;
    },
  ): Promise<User> {
    const patch: Prisma.UserUpdateInput = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (data.email !== undefined) patch.email = data.email.trim().toLowerCase();
    if (data.username !== undefined) patch.username = data.username.trim().toLowerCase();
    if (data.timezone !== undefined) patch.timezone = data.timezone;
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

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordLastChangedAt: new Date(),
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    return this.updatePasswordHash(userId, passwordHash);
  }

  async exportAccountCsv(userId: string): Promise<string> {
    const forms = await this.prisma.form.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: {
            responses: { where: { status: { not: 'ABANDONED' as any } } },
          },
        },
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
