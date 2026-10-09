import { IsOptional, IsString } from 'class-validator';

export class RunDataQualityDto {
  @IsOptional()
  @IsString()
  clinicId?: string;
}
