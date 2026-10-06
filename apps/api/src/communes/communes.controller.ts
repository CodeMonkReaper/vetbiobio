import { Controller, Get, Query } from '@nestjs/common';
import { CommunesService } from './communes.service';

@Controller('communes')
export class CommunesController {
  constructor(private readonly communes: CommunesService) {}
  @Get() list(@Query('region') region?: string) {
    return this.communes.list(region);
  }
}
