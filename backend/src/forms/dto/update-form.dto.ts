import { IsString, IsOptional, IsEnum } from 'class-validator';
import { FormStatus } from '@prisma/client';

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(FormStatus)
  @IsOptional()
  status?: FormStatus;

  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  gradientFrom?: string;

  @IsString()
  @IsOptional()
  gradientTo?: string;

  @IsString()
  @IsOptional()
  overlayColor?: string;

  @IsString()
  @IsOptional()
  iconGradient?: string;
}
