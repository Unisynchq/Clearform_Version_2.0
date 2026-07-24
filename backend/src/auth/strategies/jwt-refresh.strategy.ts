import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { TokenBlacklistService } from '../../redis/redis-token-blacklist.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private tokenBlacklist: TokenBlacklistService,
  ) {
    const refreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      const err = new Error(
        "JWT_REFRESH_SECRET environment variable is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\" and add it to .env",
      );
      Logger.error(err.message, undefined, 'JwtRefreshStrategy');
      throw err;
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const cookies = request.cookies as Record<string, string> | undefined;
          return cookies?.['refresh_token'] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    payload: { sub: string; email: string; jti?: string; iat?: number },
  ) {
    if (!payload.sub || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isBlacklisted = await this.tokenBlacklist.isBlacklisted(
      payload.jti,
      'refresh',
    );
    if (isBlacklisted) {
      await this.tokenBlacklist.blacklistUserTokens(payload.sub);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return {
      id: payload.sub,
      email: payload.email,
      jti: payload.jti,
      iat: payload.iat,
    };
  }
}
