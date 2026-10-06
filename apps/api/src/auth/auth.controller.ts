import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 10 intentos/min por IP.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password);
    const secure = (process.env.NODE_ENV ?? '') === 'production';
    res.setHeader('Set-Cookie', this.auth.cookieFor(token, secure));
    return { data: { user } };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    const secure = (process.env.NODE_ENV ?? '') === 'production';
    res.setHeader('Set-Cookie', AuthService.clearCookie(secure));
    return { data: { ok: true } };
  }
}
