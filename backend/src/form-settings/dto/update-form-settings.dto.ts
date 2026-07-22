import {
  IsInt,
  IsBoolean,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class UpdateFormSettingsDto {
  @IsInt()
  @IsOptional()
  responseLimit?: number | null;

  @IsDateString()
  @IsOptional()
  pauseUntil?: string | null;

  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @IsString()
  @IsOptional()
  password?: string | null;

  @IsString()
  @IsOptional()
  passwordHint?: string | null;

  @IsDateString()
  @IsOptional()
  autoCloseAt?: string | null;

  @IsBoolean()
  @IsOptional()
  shareEnabled?: boolean;
}
