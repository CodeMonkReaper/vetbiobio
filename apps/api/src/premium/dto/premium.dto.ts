import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString() clinicSlug!: string;
  @IsIn(['FREE', 'PREMIUM', 'PREMIUM_PLUS']) planId!: string;
  @IsOptional() @IsString() expiresAt?: string;
}

export class CreateAdvertisementDto {
  @IsOptional() @IsString() clinicSlug?: string;
  @IsString() campaignName!: string;
  @IsIn(['SPONSORED_CLINIC', 'BANNER', 'FEATURED_SERVICE']) placement!: string;
  @IsString() startAt!: string;
  @IsString() endAt!: string;
}
