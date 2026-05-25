import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /** GET /documents?folderId=xxx&workspaceId=yyy  (folderId 생략 시 전체, null 문자열이면 루트) */
  @Get()
  findAll(
    @Query('folderId') folderId: string | undefined,
    @Query('workspaceId') workspaceId: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    // folderId=null 쿼리 → 루트(폴더 없음) 문서만, 생략 → 전체
    const folderFilter = folderId === 'null' ? null : folderId;
    return this.documentsService.findAllByOwner(user.id, folderFilter, workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.findOne(id, user.id);
  }

  @Post()
  create(
    @Body() body: { title: string; folderId?: string; workspaceId?: string },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.documentsService.create({
      title: body.title,
      ownerId: user.id,
      folderId: body.folderId,
      workspaceId: body.workspaceId,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; folderId?: string | null; workspaceId?: string | null },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.documentsService.update(id, user.id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.remove(id, user.id);
  }
}
