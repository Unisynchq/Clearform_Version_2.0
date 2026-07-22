import { Controller, Patch, Post, Delete, Body, Param } from '@nestjs/common';
import { FormSettingsService } from './form-settings.service';
import { UpdateFormSettingsDto } from './dto/update-form-settings.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/forms/:id')
export class FormSettingsController {
  constructor(private readonly formSettingsService: FormSettingsService) {}

  @Patch('settings/response-limit')
  updateResponseLimit(
    @Param('id') id: string,
    @Body('responseLimit') responseLimit: number | null,
    @CurrentUser() user: any,
  ) {
    return this.formSettingsService.update(id, user.id, { responseLimit });
  }

  @Patch('settings/notifications')
  updateNotifications(
    @Param('id') id: string,
    @Body('notificationsEnabled') notificationsEnabled: boolean,
    @CurrentUser() user: any,
  ) {
    return this.formSettingsService.update(id, user.id, {
      notificationsEnabled,
    });
  }

  @Post('pause')
  pauseForm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formSettingsService.pause(id, user.id);
  }

  @Delete('pause')
  unpauseForm(@Param('id') id: string, @CurrentUser() user: any) {
    return this.formSettingsService.unpause(id, user.id);
  }

  @Patch('settings/password')
  updatePassword(
    @Param('id') id: string,
    @Body('password') password: string | null,
    @Body('passwordHint') passwordHint: string | null,
    @CurrentUser() user: any,
  ) {
    return this.formSettingsService.update(id, user.id, {
      password,
      passwordHint,
    });
  }

  @Patch('settings/auto-close')
  updateAutoClose(
    @Param('id') id: string,
    @Body('autoCloseAt') autoCloseAt: string | null,
    @CurrentUser() user: any,
  ) {
    return this.formSettingsService.update(id, user.id, { autoCloseAt });
  }
}
