import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DataQualityTrigger, DataQualityStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';
import { DataQualityService } from './data-quality.service';
import { IncidentService } from './incident.service';
import { RunDataQualityDto } from './dto/run-data-quality.dto';
import { QueryIssuesDto } from './dto/query-issues.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/data-quality')
export class AdminDataQualityController {
  constructor(
    private readonly dataQualityService: DataQualityService,
    private readonly incidentService: IncidentService,
  ) {}

  @Post('run')
  async runAudit(
    @Body() dto: RunDataQualityDto,
    @CurrentUserId() userId: number | null,
  ) {
    const targetClinicId = dto.clinicId ? BigInt(dto.clinicId) : null;
    return this.dataQualityService.runQualityEvaluation(
      DataQualityTrigger.MANUAL,
      userId ? BigInt(userId) : null,
      targetClinicId,
    );
  }

  @Get('overview')
  async getOverview() {
    return this.dataQualityService.getOverview();
  }

  @Get('runs')
  async getRuns(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.dataQualityService.getRuns(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get('issues')
  async getIssues(@Query() query: QueryIssuesDto) {
    return this.dataQualityService.getIssues(query);
  }

  @Patch('issues/:id')
  async updateIssue(
    @Param('id') id: string,
    @Body() dto: ResolveIssueDto,
    @CurrentUserId() userId: number | null,
  ) {
    const issueId = BigInt(id);
    const userBigInt = userId ? BigInt(userId) : null;

    if (dto.status === DataQualityStatus.DISMISSED) {
      const updated = await this.incidentService.dismissIssue(
        issueId,
        userBigInt,
        dto.resolutionNotes,
      );
      return {
        ...updated,
        id: updated.id.toString(),
        clinicId: updated.clinicId.toString(),
        runId: updated.runId?.toString() ?? null,
      };
    }

    const updated = await this.incidentService.resolveIssue(
      issueId,
      userBigInt,
      dto.resolutionNotes,
    );
    return {
      ...updated,
      id: updated.id.toString(),
      clinicId: updated.clinicId.toString(),
      runId: updated.runId?.toString() ?? null,
    };
  }
}

@Controller('clinics')
export class ClinicReliabilityController {
  constructor(private readonly dataQualityService: DataQualityService) {}

  @Get(':slug/reliability')
  async getReliability(@Param('slug') slug: string) {
    return this.dataQualityService.getClinicReliability(slug);
  }
}
