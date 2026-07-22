import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
