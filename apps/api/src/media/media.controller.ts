import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { SignUploadDto, AttachPhotoDto } from './dto/media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('sign')
  sign(@Body() dto: SignUploadDto) {
    return this.media.signUpload(dto.folder);
  }

  @Post('photos')
  attach(@Body() dto: AttachPhotoDto, @CurrentUserId() userId: number | null) {
    return this.media.attachPhoto({ ...dto, userId });
  }
}
