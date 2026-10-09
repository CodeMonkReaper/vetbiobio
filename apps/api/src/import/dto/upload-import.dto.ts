import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UploadImportDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  filename?: string;
}
