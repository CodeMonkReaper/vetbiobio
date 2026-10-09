import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ImportService } from './import.service';
import { UploadImportDto } from './dto/upload-import.dto';
import { QueryBatchRowsDto } from './dto/query-batch-rows.dto';
import { UpdateRowActionDto } from './dto/update-row-action.dto';
import { ApplyBatchDto } from './dto/apply-batch.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('upload')
  async uploadBatch(
    @Body() dto: UploadImportDto,
    @CurrentUserId() userId: number | null,
  ) {
    const filename = dto.filename || 'import.csv';
    const userBigInt = userId ? BigInt(userId) : null;
    return this.importService.createBatch(filename, dto.content, userBigInt);
  }

  @Get('batches')
  async getBatches(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.importService.getBatches(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('batches/:id')
  async getBatchById(@Param('id') id: string) {
    return this.importService.getBatchById(BigInt(id));
  }

  @Get('batches/:id/rows')
  async getBatchRows(
    @Param('id') id: string,
    @Query() query: QueryBatchRowsDto,
  ) {
    return this.importService.getBatchRows(BigInt(id), query);
  }

  @Patch('batches/:id/rows/:rowId')
  async updateRowAction(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateRowActionDto,
  ) {
    return this.importService.updateRowAction(
      BigInt(id),
      BigInt(rowId),
      dto.actionType,
    );
  }

  @Post('batches/:id/apply')
  async applyBatch(
    @Param('id') id: string,
    @Body() dto: ApplyBatchDto,
    @CurrentUserId() userId: number | null,
  ) {
    const userBigInt = userId ? BigInt(userId) : null;
    return this.importService.applyBatch(BigInt(id), dto, userBigInt);
  }

  @Post('batches/:id/cancel')
  async cancelBatch(@Param('id') id: string) {
    return this.importService.cancelBatch(BigInt(id));
  }
}
