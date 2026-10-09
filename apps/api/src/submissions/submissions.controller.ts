import { Controller, Post, Body, Get, Param, NotFoundException, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post()
  async create(@Body() createSubmissionDto: CreateSubmissionDto, @Req() req: Request) {
    const clientIp = req.ip || req.socket.remoteAddress;
    return this.submissionsService.create(createSubmissionDto, clientIp);
  }

  @Get('track/:code')
  async getByTrackingCode(@Param('code') trackingCode: string) {
    const submission = await this.submissionsService.getByTrackingCode(trackingCode);
    if (!submission) {
      throw new NotFoundException('Submission not found or tracking code is invalid');
    }
    return submission;
  }
}
