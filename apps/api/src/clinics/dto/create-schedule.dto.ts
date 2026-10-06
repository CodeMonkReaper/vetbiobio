import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @IsInt() @Min(0) @Max(6) @Type(() => Number) dayOfWeek!: number;
  @IsOptional() @IsString() openingTime?: string; // HH:mm
  @IsOptional() @IsString() closingTime?: string; // HH:mm
  @IsOptional() @IsBoolean() @Type(() => Boolean) isClosed?: boolean;
  @IsOptional() @IsBoolean() @Type(() => Boolean) isOvernight?: boolean;
  @IsOptional() @IsString() label?: string;
}
