import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  Matches,
} from 'class-validator';

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
  @Matches(/^https:\/\/.+/, { message: 'avatarUrl must be a valid HTTPS URL' })
  avatarUrl?: string | null;
}
