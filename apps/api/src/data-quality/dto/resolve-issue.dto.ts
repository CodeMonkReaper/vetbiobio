import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { DataQualityStatus } from '@prisma/client';

export class ResolveIssueDto {
  @IsEnum(DataQualityStatus)
  status!: DataQualityStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Las notas de resolución deben contener al menos 5 caracteres' })
  resolutionNotes!: string;
}
