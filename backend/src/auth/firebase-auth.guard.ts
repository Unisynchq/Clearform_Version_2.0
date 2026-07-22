import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebaseService: FirebaseService,
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    if (isPublic) {
      await this.tryAttachUser(request);
      return true;
    }

    const attached = await this.tryAttachUser(request);
    if (!attached) {
      throw new UnauthorizedException('No token provided');
    }
    return true;
  }

  /** Best-effort auth for public routes; required auth throws on missing/invalid token. */
  private async tryAttachUser(request: {
    headers: { authorization?: string };
    user?: unknown;
  }): Promise<boolean> {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await this.firebaseService
        .getAuth()
        .verifyIdToken(token);

      const email = decodedToken.email;
      const uid = decodedToken.uid;

      if (!email) {
        throw new UnauthorizedException('Token missing email claim');
      }

      const displayName = decodedToken.name || '';
      const parts = displayName.trim().split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';

      const dbUser = await this.usersService.findOrCreateFromFirebase({
        id: uid,
        email,
        firstName,
        lastName,
      });

      request.user = {
        ...decodedToken,
        id: dbUser.id,
        firebaseUid: uid,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      console.error('Firebase Auth Error:', message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
