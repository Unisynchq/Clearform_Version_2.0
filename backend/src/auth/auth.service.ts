import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {}

  /** @deprecated SPA uses Firebase; kept for legacy tooling only */
  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      passwordHash,
    });
    return this.generateTokens(user);
  }

  /** @deprecated SPA uses Firebase; kept for legacy tooling only */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async getMe(userId: string, email?: string) {
    let profile = await this.loadProfileSafe(userId);

    if (!profile && email) {
      const byEmail = await this.usersService.findByEmail(email);
      if (byEmail) {
        profile = await this.loadProfileSafe(byEmail.id);
      }
    }

    if (!profile) {
      throw new NotFoundException('User not found');
    }
    return { user: this.serializeUserProfile(profile) };
  }

  private async loadProfileSafe(userId: string) {
    try {
      return await this.usersService.getProfile(userId);
    } catch (err) {
      if (process.env.SENTRY_DSN) {
        Sentry.captureException(err, {
          tags: { area: 'auth/me' },
          extra: { userId },
        });
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`getProfile failed for ${userId}: ${msg}`);
      const basic = await this.usersService.findById(userId);
      if (!basic) return null;
      return { ...basic, subscription: null, _count: { forms: 0 } };
    }
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      avatarUrl?: string | null;
    },
  ) {
    // If email changes, sync it in Firebase too
    if (data.email) {
      try {
        await this.firebaseService
          .getAuth()
          .updateUser(userId, { email: data.email });
      } catch (err) {
        // Firebase user may be legacy (no Firebase record) — continue with DB update
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Firebase email update skipped for ${userId}: ${msg}`);
      }
    }
    const updated = await this.usersService.updateProfile(userId, data);
    return { user: this.serializeUserProfile(updated) };
  }

  async deleteAccount(userId: string): Promise<void> {
    // Delete Firebase user first (throws if uid doesn't exist in Firebase, which we swallow)
    try {
      await this.firebaseService.getAuth().deleteUser(userId);
    } catch {
      // Firebase user may not exist (legacy JWT account) — continue with DB cleanup
    }
    // Prisma cascade handles forms, workspaces, responses, webhooks, subscriptions, notifications
    await this.usersService.deleteById(userId);
  }

  async exportAccountCsv(userId: string): Promise<string> {
    return this.usersService.exportAccountCsv(userId);
  }

  async completeOnboarding(userId: string) {
    await this.usersService.markOnboardingComplete(userId);
    return this.getMe(userId);
  }

  serializeUserProfile(
    profile: User & {
      subscription?: { planId: string; status: string } | null;
      _count?: { forms: number };
    },
  ) {
    const onboardingCompleted =
      !!profile.onboardingCompletedAt || (profile._count?.forms ?? 0) > 0;

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl ?? null,
      onboardingCompleted,
      needsOnboarding: !onboardingCompleted,
      plan: profile.subscription?.planId ?? 'trial',
    };
  }

  private generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }
}
