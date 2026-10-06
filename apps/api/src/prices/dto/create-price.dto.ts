import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServicePriceDto {
  @IsInt() @Min(1) @Type(() => Number) clinicServiceId!: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) minAmount?: number;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) maxAmount?: number;
  @IsIn(['FIXED', 'RANGE', 'FROM', 'CONTACT']) pricingType!: 'FIXED' | 'RANGE' | 'FROM' | 'CONTACT';
  @IsOptional() @IsString() validFrom?: string;
  @IsOptional() @IsString() source?: string;
}
