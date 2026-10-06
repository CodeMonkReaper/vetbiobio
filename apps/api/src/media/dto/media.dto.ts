import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class SignUploadDto {
  @IsOptional() @IsString() folder?: string;
}

export class AttachPhotoDto {
  @IsString() clinicSlug!: string;
  @IsUrl({ protocols: ['https'], require_protocol: true }) url!: string;
  @IsOptional() @IsString() publicId?: string;
  @IsOptional() @IsString() altText?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) makePrimary?: boolean;
}
