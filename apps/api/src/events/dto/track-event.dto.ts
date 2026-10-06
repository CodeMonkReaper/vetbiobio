import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackEventDto {
  @IsOptional() @IsString() @MaxLength(120) clinicSlug?: string;
  @IsString() @MaxLength(40) type!: string;
  @IsOptional() @IsString() @MaxLength(64) sessionHash?: string;
}
