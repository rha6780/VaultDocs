import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async upsertGoogleUser(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { googleId: data.googleId },
      update: { name: data.name, avatarUrl: data.avatarUrl },
      create: data,
    });
  }

  async updateRefreshToken(id: string, hashedToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: hashedToken },
    });
  }
}
