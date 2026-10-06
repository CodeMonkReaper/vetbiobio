import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { SearchClinicsDto } from './dto/search-clinics.dto';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinics: ClinicsService) {}
  @Get() list(@Query() q: SearchClinicsDto) {
    return this.clinics.search(q);
  }
  @Get('compare/by-slugs') compare(
    @Query('slugs') slugs: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    return this.clinics.compare(
      (slugs ?? '').split(','),
      lat !== undefined ? Number(lat) : undefined,
      lng !== undefined ? Number(lng) : undefined,
    );
  }
  @Get(':slug') bySlug(@Param('slug') slug: string) {
    return this.clinics.getProfile(slug);
  }
}
