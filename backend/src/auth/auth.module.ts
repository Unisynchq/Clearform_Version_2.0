import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { AvatarStorageService } from './avatar-storage.service';

/** Legacy email/password routes only; global auth uses FirebaseAuthGuard (see app.module). */
@Module({
  imports: [UsersModule, JwtModule.register({}), FirebaseModule],
  controllers: [AuthController],
  providers: [AuthService, AvatarStorageService],
})
export class AuthModule {}
