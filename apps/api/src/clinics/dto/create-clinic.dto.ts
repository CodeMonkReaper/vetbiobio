import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClinicDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() phone?: string; // E.164, se normaliza en servicio
  @IsOptional() @IsString() website?: string;
  @IsString() communeCut!: string; // código CUT oficial, nunca nombre libre
  @IsString() address!: string;
  @IsNumber() @Min(-90) @Max(90) @Type(() => Number) latitude!: number;
  @IsNumber() @Min(-180) @Max(180) @Type(() => Number) longitude!: number;
  @IsOptional() @IsBoolean() @Type(() => Boolean) isEmergency?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) is24h?: boolean;
}
