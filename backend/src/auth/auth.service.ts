import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { TokenBlacklistService } from '../redis/redis-token-blacklist.service';
import { randomUUID } from 'crypto';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '24h';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private tokenBlacklist: TokenBlacklistService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      passwordHash,
    });
    this.logger.log(`User registered: ${user.id}`);
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(
        `Login failed: no user found for email ${loginDto.email}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      this.logger.warn(`Login failed: invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.id}`);
    return this.generateTokens(user);
  }

  async refreshAccessToken(
    userId: string,
    refreshTokenJti: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _refreshTokenIat: number,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const isBlacklisted = await this.tokenBlacklist.isBlacklisted(
      refreshTokenJti,
      'refresh',
    );
    if (isBlacklisted) {
      await this.tokenBlacklist.blacklistUserTokens(userId);
      this.logger.warn(`Refresh token reuse detected for user ${userId}`);
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.tokenBlacklist.blacklistToken(refreshTokenJti, 'refresh');

    const tokens = this.generateTokens(user);
    this.logger.log(`Tokens rotated for user ${userId}`);
    return tokens;
  }

  async logout(
    userId: string,
    accessTokenJti: string,
    accessTokenExp?: number,
  ): Promise<void> {
    await this.tokenBlacklist.blacklistToken(
      accessTokenJti,
      'access',
      accessTokenExp,
    );
    await this.tokenBlacklist.blacklistUserTokens(userId);
    this.logger.log(`User logged out: ${userId}`);
  }

  async getMe(
    userId: string,
    email?: string,
  ): Promise<{ user: ReturnType<AuthService['serializeUserProfile']> }> {
    const profile = await this.loadProfileSafe(userId);

    if (!profile && email) {
      const byEmail = await this.usersService.findByEmail(email);
      if (byEmail) {
        return this.getMe(byEmail.id);
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
      Sentry.captureException(err, {
        tags: { area: 'auth/me' },
        extra: { userId },
      });
      this.logger.error(
        `getProfile failed for ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
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
    if (data.email) {
      try {
        await this.firebaseService
          .getAuth()
          .updateUser(userId, { email: data.email });
      } catch {
        this.logger.warn(`Firebase email update skipped for ${userId}`);
      }
    }
    const updated = await this.usersService.updateProfile(userId, data);
    return { user: this.serializeUserProfile(updated) };
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await this.firebaseService.getAuth().deleteUser(userId);
    } catch {
      // Firebase user may not exist
    }
    await this.tokenBlacklist.blacklistUserTokens(userId);
    await this.usersService.deleteById(userId);
    this.logger.log(`Account deleted: ${userId}`);
  }

  async exportAccountCsv(userId: string): Promise<string> {
    return this.usersService.exportAccountCsv(userId);
  }

  async completeOnboarding(userId: string) {
    await this.usersService.markOnboardingComplete(userId);
    return this.getMe(userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(userId, newHash);
    await this.tokenBlacklist.blacklistUserTokens(userId);
    this.logger.log(`Password changed for user ${userId}`);
  }

  serializeUserProfile(profile: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    passwordHash?: string;
    passwordLastChangedAt?: Date | null;
    onboardingCompletedAt?: Date | null;
    subscription?: { planId: string; status: string } | null;
    _count?: { forms: number };
  }) {
    const onboardingCompleted =
      !!profile.onboardingCompletedAt || (profile._count?.forms ?? 0) > 0;
    const hasPassword = Boolean(
      profile.passwordHash && profile.passwordHash.length > 0,
    );

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl ?? null,
      hasPassword,
      passwordLastChangedAt: profile.passwordLastChangedAt ?? null,
      onboardingCompleted,
      needsOnboarding: !onboardingCompleted,
      plan: profile.subscription?.planId ?? 'trial',
    };
  }

  private generateTokens(user: { id: string; email: string }) {
    const jti = randomUUID();
    const payload = { email: user.email, sub: user.id, jti };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
