import { IsIn, IsOptional, IsString, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export const ANIMAL_SPECIES = [
  'DOG',
  'CAT',
  'RABBIT',
  'BIRD',
  'REPTILE',
  'RODENT',
  'EXOTIC',
  'OTHER',
] as const;

export type AnimalSpeciesType = (typeof ANIMAL_SPECIES)[number];

export class SearchClinicsDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() commune?: string;
  @IsOptional() @IsString() exam?: string;
  @IsOptional() @IsString() service?: string;
  @IsOptional() @IsString() specialty?: string;
  @IsOptional()
  @IsIn(ANIMAL_SPECIES, {
    message: `species debe ser uno de: ${ANIMAL_SPECIES.join(', ')}`,
  })
  species?: AnimalSpeciesType;
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
