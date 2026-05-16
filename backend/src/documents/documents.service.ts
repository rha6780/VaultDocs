import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { Document } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByOwner(ownerId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Document> {
    const doc = await this.prisma.document.findFirst({ where: { id, ownerId } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(data: { title: string; ownerId: string }): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  async update(id: string, ownerId: string, data: { title?: string; content?: string }): Promise<Document> {
    await this.findOne(id, ownerId);
    return this.prisma.document.update({ where: { id }, data });
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOne(id, ownerId);
    await this.prisma.document.delete({ where: { id } });
  }
}
