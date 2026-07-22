import { IsString, IsOptional } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  colour?: string;
}
