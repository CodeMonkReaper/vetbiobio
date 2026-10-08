import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PricesService } from './prices.service';
import { CreateServicePriceDto, CreateExamPriceDto } from './dto/create-price.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/prices')
export class PricesController {
  constructor(private readonly prices: PricesService) {}
  @Post('service') addService(@Body() dto: CreateServicePriceDto, @CurrentUserId() userId: number | null) {
    return this.prices.addServicePrice({ ...dto, userId });
  }

  @Post('exam') addExam(@Body() dto: CreateExamPriceDto, @CurrentUserId() userId: number | null) {
    return this.prices.addExamPrice({ ...dto, userId });
  }
}
