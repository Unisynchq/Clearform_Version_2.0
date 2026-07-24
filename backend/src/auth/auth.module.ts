import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { AvatarStorageService } from './avatar-storage.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { TokenBlacklistService } from '../redis/redis-token-blacklist.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [UsersModule, JwtModule.register({}), FirebaseModule, ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AvatarStorageService,
    JwtStrategy,
    JwtRefreshStrategy,
    TokenBlacklistService,
  ],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}
