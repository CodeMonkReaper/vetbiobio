import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  // Público con rate-limit 5/h por IP.
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post('reports')
  create(@Body() body: { clinicId?: number; clinicSlug?: string; reason: string; message?: string }) {
    return this.reports.create(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Get('admin/reports')
  listOpen() {
    return this.reports.listOpen();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Patch('admin/reports/:id')
  resolve(@Param('id') id: string, @Body() body: { status: 'TRIAGED' | 'RESOLVED' | 'REJECTED' }) {
    return this.reports.resolve(Number(id), body.status);
  }
}
