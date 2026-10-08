import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const REPORT_REASONS = [
  'CLOSED', 'WRONG_PRICE', 'WRONG_SCHEDULE', 'WRONG_PHONE',
  'SERVICE_UNAVAILABLE', 'PROFESSIONAL_LEFT', 'OTHER',
] as const;

export const REPORT_STATUSES = ['OPEN', 'TRIAGED', 'RESOLVED', 'REJECTED'] as const;

export class CreateReportDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) clinicId?: number;
  @IsOptional() @IsString() @MaxLength(200) clinicSlug?: string;
  @IsIn(REPORT_REASONS) reason!: (typeof REPORT_REASONS)[number];
  @IsOptional() @IsString() @MaxLength(500) message?: string;
}

export class ResolveReportDto {
  @IsIn(['TRIAGED', 'RESOLVED', 'REJECTED']) status!: 'TRIAGED' | 'RESOLVED' | 'REJECTED';
}

export class ListReportsDto {
  @IsOptional() @IsIn(REPORT_STATUSES) status?: (typeof REPORT_STATUSES)[number];
}
