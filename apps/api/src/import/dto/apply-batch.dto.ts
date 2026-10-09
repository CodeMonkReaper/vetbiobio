import { IsBoolean, IsOptional } from 'class-validator';

export class ApplyBatchDto {
  @IsBoolean()
  @IsOptional()
  applyDuplicatesAsNew?: boolean;
}
