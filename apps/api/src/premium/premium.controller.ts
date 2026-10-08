import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PremiumService } from './premium.service';
import { CreateSubscriptionDto, CreateAdvertisementDto } from './dto/premium.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUserId } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
@Controller('admin/monetization')
export class PremiumController {
  constructor(private readonly premium: PremiumService) {}

  @Post('subscriptions')
  createSubscription(@Body() dto: CreateSubscriptionDto, @CurrentUserId() userId: number | null) {
    return this.premium.createSubscription({ ...dto, userId });
  }

  @Post('advertisements')
  createAdvertisement(@Body() dto: CreateAdvertisementDto, @CurrentUserId() userId: number | null) {
    return this.premium.createAdvertisement({ ...dto, userId });
  }
}
