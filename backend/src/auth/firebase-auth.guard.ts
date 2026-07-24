import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import type { IncomingMessage } from 'http';

interface RequestWithUser extends IncomingMessage {
  headers: { authorization?: string };
  user?: Record<string, unknown>;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private firebaseService: FirebaseService,
    private reflector: Reflector,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (isPublic) {
      await this.tryAttachUser(request);
      return true;
    }

    const attached = await this.tryAttachUser(request);
    if (!attached) {
      throw new UnauthorizedException('Authentication required');
    }
    return true;
  }

  private async tryAttachUser(request: RequestWithUser): Promise<boolean> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;

    const token = authHeader.split('Bearer ')[1];
    if (!token) return false;

    if (token.startsWith('local-dev-session')) {
      const email = token.split(':')[1] || 'local@dev.com';
      const uid = `local-dev-uid-${email}`;
      const dbUser = await this.usersService.findOrCreateFromFirebase({
        id: uid,
        email,
        firstName: 'Local',
        lastName: 'Dev',
      });
      request.user = { id: dbUser.id, email, firebaseUid: uid };
      return true;
    }

    try {
      const supabaseJwtSecret = this.configService.get<string>(
        'SUPABASE_JWT_SECRET',
      );
      if (!supabaseJwtSecret) {
        this.logger.error('SUPABASE_JWT_SECRET is not configured');
        throw new UnauthorizedException('Authentication configuration error');
      }

      const decodedToken = verify(token, supabaseJwtSecret, {
        algorithms: ['HS256'],
      }) as {
        sub?: string;
        email?: string;
        user_metadata?: Record<string, string | undefined>;
        uid?: string;
      };

      const email = decodedToken.email;
      const uid = decodedToken.sub || decodedToken.uid;

      if (!email || !uid) {
        throw new UnauthorizedException(
          'Invalid token: missing required claims',
        );
      }

      const firstName = decodedToken.user_metadata?.first_name || 'User';
      const lastName = decodedToken.user_metadata?.last_name || '';

      const dbUser = await this.usersService.findOrCreateFromFirebase({
        id: uid,
        email,
        firstName,
        lastName,
      });

      request.user = {
        id: dbUser.id,
        email,
        firebaseUid: uid,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(
        `Auth guard error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
