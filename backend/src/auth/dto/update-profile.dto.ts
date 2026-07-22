import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, ValidateIf } from 'class-validator';

const HTTPS_URL = /^https:\/\/.+/i;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  avatarUrl?: string | null;
}

export function isAllowedAvatarUrl(url: string): boolean {
  if (!HTTPS_URL.test(url)) return false;
  if (url.startsWith('data:')) return false;
  return true;
}
