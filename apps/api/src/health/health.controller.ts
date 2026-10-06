import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get() check() {
    return { status: 'ok', db: 'pending', postgis: 'pending', uptime: process.uptime() };
  }
}
