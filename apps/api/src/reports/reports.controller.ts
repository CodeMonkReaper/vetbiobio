import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service';
import { CreateReportDto, ListReportsDto, ResolveReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // Público con rate-limit 5/h por IP.
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('reports')
  create(@Body() dto: CreateReportDto) {
    return this.reports.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Get('admin/reports')
  list(@Query() q: ListReportsDto) {
    return this.reports.list(q.status ?? 'OPEN');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Patch('admin/reports/:id')
  resolve(@Param('id', ParseIntPipe) id: number, @Body() dto: ResolveReportDto, @CurrentUserId() userId: number | null) {
    return this.reports.resolve(id, dto.status, userId);
  }
}
