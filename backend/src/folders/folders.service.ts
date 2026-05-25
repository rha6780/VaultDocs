import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { Folder } from '@prisma/client';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  /** 루트 폴더 목록 (parentId = null, workspaceId 필터 선택) */
  async findRootFolders(ownerId: string, workspaceId?: string): Promise<Folder[]> {
    return this.prisma.folder.findMany({
      where: {
        ownerId,
        parentId: null,
        ...(workspaceId !== undefined ? { workspaceId } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  /** 특정 폴더의 하위 폴더 목록 */
  async findChildren(parentId: string, ownerId: string): Promise<Folder[]> {
    return this.prisma.folder.findMany({
      where: { parentId, ownerId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Folder> {
    const folder = await this.prisma.folder.findFirst({ where: { id, ownerId } });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async create(data: { name: string; ownerId: string; parentId?: string; workspaceId?: string }): Promise<Folder> {
    if (data.parentId) {
      await this.findOne(data.parentId, data.ownerId);
    }
    return this.prisma.folder.create({ data });
  }

  async rename(id: string, ownerId: string, name: string): Promise<Folder> {
    await this.findOne(id, ownerId);
    return this.prisma.folder.update({ where: { id }, data: { name } });
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const folder = await this.findOne(id, ownerId);
    const childCount = await this.prisma.folder.count({ where: { parentId: folder.id } });
    const docCount = await this.prisma.document.count({ where: { folderId: folder.id } });
    if (childCount > 0 || docCount > 0) {
      throw new ForbiddenException('폴더가 비어있지 않습니다. 내용을 먼저 이동하거나 삭제하세요.');
    }
    await this.prisma.folder.delete({ where: { id } });
  }

  /** 폴더 경로(breadcrumb) — id부터 루트까지 역추적 */
  async getBreadcrumb(id: string, ownerId: string): Promise<Folder[]> {
    const crumbs: Folder[] = [];
    let current: Folder | null = await this.findOne(id, ownerId);
    while (current) {
      crumbs.unshift(current);
      if (!current.parentId) break;
      current = await this.prisma.folder.findFirst({ where: { id: current.parentId, ownerId } });
    }
    return crumbs;
  }
}
