import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as DiffMatchPatch from 'diff-match-patch';
import type { VersionSnapshot } from '@prisma/client';

const dmp = new DiffMatchPatch.diff_match_patch();

@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(documentId: string): Promise<VersionSnapshot[]> {
    return this.prisma.versionSnapshot.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
    });
  }

  async createSnapshot(params: {
    documentId: string;
    createdById: string;
    previousContent: string;
    newContent: string;
  }): Promise<VersionSnapshot> {
    const { documentId, createdById, previousContent, newContent } = params;

    const last = await this.prisma.versionSnapshot.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
    });

    const version = (last?.version ?? 0) + 1;
    const diff = JSON.stringify(dmp.diff_main(previousContent, newContent));

    return this.prisma.versionSnapshot.create({
      data: {
        documentId,
        createdById,
        version,
        diff,
        snapshot: newContent,
      },
    });
  }
}
