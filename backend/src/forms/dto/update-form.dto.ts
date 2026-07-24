import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Validate,
} from 'class-validator';
import { FormStatus } from '@prisma/client';
import { IsValidUuidConstraint } from '../../common/validators/uuid.validator';

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsEnum(FormStatus)
  @IsOptional()
  status?: FormStatus;

  @IsString()
  @IsOptional()
  @Validate(IsValidUuidConstraint)
  workspaceId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  gradientFrom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  gradientTo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  overlayColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  iconGradient?: string;
}
