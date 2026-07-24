import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from '../../redis/redis-token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private tokenBlacklist: TokenBlacklistService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      const err = new Error(
        "JWT_SECRET environment variable is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\" and add it to .env",
      );
      Logger.error(err.message, undefined, 'JwtStrategy');
      throw err;
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    jti?: string;
    iat?: number;
    exp?: number;
  }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (payload.jti) {
      const isBlacklisted = await this.tokenBlacklist.isBlacklisted(
        payload.jti,
        'access',
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    if (payload.sub && payload.iat) {
      const isUserBlacklisted = await this.tokenBlacklist.isUserBlacklisted(
        payload.sub,
        payload.iat,
      );
      if (isUserBlacklisted) {
        throw new UnauthorizedException('Session has been invalidated');
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
    };
  }
}
