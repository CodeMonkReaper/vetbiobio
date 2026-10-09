import { IsEnum } from 'class-validator';
import { ImportActionType } from '@prisma/client';

export class UpdateRowActionDto {
  @IsEnum(ImportActionType)
  actionType!: ImportActionType;
}
