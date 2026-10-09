import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DataQualityStatus, DataQualitySeverity } from '@prisma/client';

export class QueryIssuesDto {
  @IsOptional()
  @IsEnum(DataQualityStatus)
  status?: DataQualityStatus;

  @IsOptional()
  @IsEnum(DataQualitySeverity)
  severity?: DataQualitySeverity;

  @IsOptional()
  @IsString()
  ruleCode?: string;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  commune?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
