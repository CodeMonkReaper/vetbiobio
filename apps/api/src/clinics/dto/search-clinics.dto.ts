import { IsIn, IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchClinicsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() commune?: string;
  @IsOptional() @IsString() exam?: string;
  @IsOptional() @IsString() service?: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() species?: string; // DOG|CAT|... (animal_species)
  @IsOptional() @IsNumber() @Type(() => Number) lat?: number;
  @IsOptional() @IsNumber() @Type(() => Number) lng?: number;
  @IsOptional() @IsNumber() @Min(0.5) @Max(50) @Type(() => Number) radius_km?: number;
  @IsOptional() @IsBoolean() @Type(() => Boolean) emergency?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) verified_only?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) min_price?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) max_price?: number;
  @IsOptional() @IsIn(['RELEVANCE', 'DISTANCE', 'PRICE_ASC', 'PRICE_DESC', 'VERIFICATION']) sort?: 'RELEVANCE' | 'DISTANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'VERIFICATION';
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number) limit?: number;
}
