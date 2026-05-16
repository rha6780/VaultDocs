import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { User } from '@prisma/client';

const DEV_USER = {
  googleId: 'dev-user-001',
  email: 'dev@vaultdocs.local',
  name: 'Dev User',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.usersService.upsertGoogleUser(profile);
  }

  async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashed);

    return { accessToken, refreshToken };
  }

  async devLogin(): Promise<{ user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: string }; tokens: { accessToken: string; refreshToken: string } }> {
    const user = await this.usersService.upsertGoogleUser(DEV_USER);
    const tokens = await this.generateTokens(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }
}
