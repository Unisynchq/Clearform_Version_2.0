import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Validate,
} from 'class-validator';
import { IsValidUuidConstraint } from '../../common/validators/uuid.validator';

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

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
