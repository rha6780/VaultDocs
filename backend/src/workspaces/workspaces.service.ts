import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { Workspace } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByOwner(ownerId: string): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findFirst({ where: { id, ownerId } });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async create(data: { name: string; description?: string; ownerId: string }): Promise<Workspace> {
    return this.prisma.workspace.create({ data });
  }

  async update(
    id: string,
    ownerId: string,
    data: { name?: string; description?: string },
  ): Promise<Workspace> {
    await this.findOne(id, ownerId);
    return this.prisma.workspace.update({ where: { id }, data });
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.prisma.workspace.delete({ where: { id } });
  }
}
