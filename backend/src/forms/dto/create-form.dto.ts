import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

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
