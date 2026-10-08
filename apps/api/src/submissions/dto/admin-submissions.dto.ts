import { IsString, IsOptional, IsInt, IsBoolean, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminListSubmissionsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ApproveSubmissionDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsBoolean()
  publishDirectly?: boolean;
}

export class RejectSubmissionDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  clinicId?: string;
}
