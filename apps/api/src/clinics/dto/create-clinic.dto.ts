import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClinicDto {
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string; // E.164, se normaliza en servicio
  @IsOptional() @IsString() @MaxLength(20) whatsapp?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MaxLength(300) website?: string;
  @IsString() communeCut!: string; // código CUT oficial, nunca nombre libre
  @IsString() @MaxLength(300) address!: string;
  @IsNumber() @Min(-90) @Max(90) @Type(() => Number) latitude!: number;
  @IsNumber() @Min(-180) @Max(180) @Type(() => Number) longitude!: number;
  @IsOptional() @IsBoolean() @Type(() => Boolean) isEmergency?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) is24h?: boolean;
}
