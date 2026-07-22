import { Module } from '@nestjs/common';
import { FormSettingsService } from './form-settings.service';
import { FormSettingsController } from './form-settings.controller';

@Module({
  providers: [FormSettingsService],
  controllers: [FormSettingsController],
})
export class FormSettingsModule {}
