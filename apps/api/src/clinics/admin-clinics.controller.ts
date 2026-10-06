import { Controller, Post, Patch, Param, Body, Get, UseGuards } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// CRUD administrativo. Requiere sesión ADMIN/EDITOR.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/clinics')
export class AdminClinicsController {
  constructor(private readonly clinics: ClinicsService) {}
  @Post() create(@Body() dto: CreateClinicDto) {
    return this.clinics.createDraft(dto);
  }
  @Patch(':id/deactivate') deactivate(@Param('id') id: string) {
    return this.clinics.deactivate(Number(id));
  }
  @Get(':slug') bySlug(@Param('slug') slug: string) {
    return this.clinics.bySlugWithRedirect(slug);
  }
}
