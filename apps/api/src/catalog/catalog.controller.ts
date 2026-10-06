import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('services') services() {
    return this.catalog.services();
  }
  @Get('specialties') specialties() {
    return this.catalog.specialties();
  }
  @Get('exams') exams() {
    return this.catalog.exams();
  }
}
