import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ImportRowStatus, ImportActionType } from '@prisma/client';

export class QueryBatchRowsDto {
  @IsOptional()
  @IsEnum(ImportRowStatus)
  status?: ImportRowStatus;

  @IsOptional()
  @IsEnum(ImportActionType)
  actionType?: ImportActionType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
