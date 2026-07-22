import {
  IsUrl,
  IsArray,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';

export class CreateWebhookDto {
  @IsUrl()
  url!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  triggers?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  /** Optional HMAC secret; sent as X-Clearform-Signature (sha256 hex). */
  @IsString()
  @IsOptional()
  secret?: string;
}
