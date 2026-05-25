import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { FoldersService } from './folders.service';

@Controller('folders')
@UseGuards(AuthGuard('jwt'))
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  /** GET /folders?parentId=xxx  (생략 시 루트) */
  @Get()
  list(@Query('parentId') parentId: string | undefined, @Req() req: Request) {
    const user = req.user as User;
    return parentId
      ? this.foldersService.findChildren(parentId, user.id)
      : this.foldersService.findRootFolders(user.id);
  }

  /** GET /folders/:id/breadcrumb */
  @Get(':id/breadcrumb')
  breadcrumb(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.foldersService.getBreadcrumb(id, user.id);
  }

  /** GET /folders/:id */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.foldersService.findOne(id, user.id);
  }

  /** POST /folders */
  @Post()
  create(
    @Body() body: { name: string; parentId?: string },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.foldersService.create({ name: body.name, ownerId: user.id, parentId: body.parentId });
  }

  /** PATCH /folders/:id */
  @Patch(':id')
  rename(
    @Param('id') id: string,
    @Body() body: { name: string },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.foldersService.rename(id, user.id, body.name);
  }

  /** DELETE /folders/:id */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.foldersService.remove(id, user.id);
  }
}
