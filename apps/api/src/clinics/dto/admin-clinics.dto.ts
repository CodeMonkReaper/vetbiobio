import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const CLINIC_STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'CLOSED', 'PENDING_VERIFICATION'] as const;
export type ClinicStatusValue = (typeof CLINIC_STATUSES)[number];

export class AdminListClinicsDto {
  @IsOptional() @IsIn(CLINIC_STATUSES) status?: ClinicStatusValue;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsInt() @Min(1) @Type(() => Number) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number) limit?: number;
}

export class ChangeClinicStatusDto {
  @IsIn(CLINIC_STATUSES) status!: ClinicStatusValue;
}
