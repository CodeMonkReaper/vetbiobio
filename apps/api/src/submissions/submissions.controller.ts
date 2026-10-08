import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  async create(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionsService.create(createSubmissionDto);
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
