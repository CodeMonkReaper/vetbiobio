import { IsString, IsOptional, IsEmail, IsObject, IsBoolean, IsIn, ValidateIf } from 'class-validator';

export const SUBMISSION_TYPES = [
  'NEW_CLINIC',
  'UPDATE_CLINIC',
  'REPORT_CLOSURE',
  'NEW_SERVICE',
  'UPDATE_PRICE',
  'NEW_PROMOTION',
  'CORRECT_DATA',
  'OTHER',
] as const;

export type SubmissionType = typeof SUBMISSION_TYPES[number];

export class CreateSubmissionDto {
  @IsString()
  @IsIn(SUBMISSION_TYPES)
  type!: SubmissionType;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsObject()
  payload!: Record<string, any>;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;

  @IsOptional()
  @IsString()
  submitterName?: string;

  @IsOptional()
  @IsEmail()
  submitterEmail?: string;

  @ValidateIf(o => o.submitterEmail != null)
  @IsBoolean()
  hasConsent?: boolean;
}
