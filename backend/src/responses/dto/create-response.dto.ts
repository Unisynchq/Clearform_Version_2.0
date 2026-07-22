import { IsObject, IsOptional, IsString } from 'class-validator';

/** Accepts `{ data }` wrapper or handoff top-level fields (normalized in controller). */
export class CreateResponseDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  answersByScreenId?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  submittedAt?: string;
}
