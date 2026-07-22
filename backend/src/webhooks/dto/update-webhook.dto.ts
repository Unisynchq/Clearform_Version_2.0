import {
  IsUrl,
  IsArray,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';

export class UpdateWebhookDto {
  @IsUrl()
  @IsOptional()
  url?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  triggers?: string[];

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  secret?: string;
}
