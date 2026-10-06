import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChangeStatusDto {
  @IsString() entityType!: string;
  @IsInt() @Min(1) @Type(() => Number) entityId!: number;
  @IsIn(['UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'OUTDATED', 'REJECTED']) newStatus!: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'OUTDATED' | 'REJECTED';
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() nextReviewAt?: string;
}
