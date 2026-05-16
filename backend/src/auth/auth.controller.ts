import { Controller, Get, Req, Res, UseGuards, Post, HttpCode, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // passport가 Google로 리다이렉트
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = await this.authService.generateTokens(user.id);
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';

    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  // dev 환경 전용 — production에서는 403 반환
  @Post('dev-login')
  @HttpCode(200)
  async devLogin() {
    if (this.config.get('NODE_ENV') === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    return this.authService.devLogin();
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request) {
    const user = req.user as User;
    await this.authService.logout(user.id);
    return { message: 'ok' };
  }
}
