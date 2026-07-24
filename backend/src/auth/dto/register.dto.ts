import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { PasswordComplexityConstraint } from '../../common/validators/password.validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterDto {
  @IsEmail()
  @Transform(normalizeEmail)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Validate(PasswordComplexityConstraint)
  password!: string;
}
