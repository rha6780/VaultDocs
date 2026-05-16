import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.findAllByOwner(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.findOne(id, user.id);
  }

  @Post()
  create(@Body() body: { title: string }, @Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.create({ title: body.title, ownerId: user.id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; content?: string }, @Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.update(id, user.id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.documentsService.remove(id, user.id);
  }
}
