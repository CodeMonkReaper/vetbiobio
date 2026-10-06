import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import { TrackEventDto } from './dto/track-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // Público, limitado: 60/min por IP.
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Post('events')
  track(@Body() dto: TrackEventDto) {
    return this.events.track(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  @Get('admin/stats/daily')
  daily(@Query('slug') slug: string, @Query('days') days?: string) {
    return this.events.dailyCounts(slug, days ? Math.min(Number(days) || 30, 90) : 30);
  }
}
