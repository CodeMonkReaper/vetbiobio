import { Controller, Post, Patch, Param, Body, Get, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { AdminListClinicsDto, ChangeClinicStatusDto } from './dto/admin-clinics.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

// CRUD administrativo. Requiere sesión ADMIN/EDITOR. Toda escritura registra actor.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/clinics')
export class AdminClinicsController {
  constructor(private readonly clinics: ClinicsService) {}

  // Listado admin: TODOS los estados (el buscador público solo ve ACTIVE).
  @Get() list(@Query() q: AdminListClinicsDto) {
    return this.clinics.adminList(q);
  }

  @Post() create(@Body() dto: CreateClinicDto, @CurrentUserId() userId: number | null) {
    return this.clinics.createDraft(dto, userId);
  }

  // Publicar (ACTIVE), despublicar (DRAFT), desactivar (INACTIVE) o cerrar (CLOSED).
  @Patch(':id/status') changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeClinicStatusDto,
    @CurrentUserId() userId: number | null,
  ) {
    return this.clinics.changeStatus(id, dto.status, userId);
  }

  @Patch(':id/deactivate') deactivate(@Param('id', ParseIntPipe) id: number, @CurrentUserId() userId: number | null) {
    return this.clinics.deactivate(id, userId);
  }

  @Get(':slug') bySlug(@Param('slug') slug: string) {
    return this.clinics.bySlugWithRedirect(slug);
  }

  // Servicios/exámenes con ids (para cargar precios) + precio vigente.
  @Get(':slug/services') services(@Param('slug') slug: string) {
    return this.clinics.adminServices(slug);
  }

  @Get(':slug/schedules') schedules(@Param('slug') slug: string) {
    return this.clinics.adminSchedules(slug);
  }

  @Post(':slug/schedules') addSchedule(
    @Param('slug') slug: string,
    @Body() dto: CreateScheduleDto,
    @CurrentUserId() userId: number | null,
  ) {
    return this.clinics.adminAddSchedule(slug, dto, userId);
  }
}
