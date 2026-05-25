import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(AuthGuard('jwt'))
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  /** GET /workspaces */
  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.workspacesService.findAllByOwner(user.id);
  }

  /** GET /workspaces/:id */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.workspacesService.findOne(id, user.id);
  }

  /** POST /workspaces */
  @Post()
  create(
    @Body() body: { name: string; description?: string },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.workspacesService.create({
      name: body.name,
      description: body.description,
      ownerId: user.id,
    });
  }

  /** PATCH /workspaces/:id */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.workspacesService.update(id, user.id, body);
  }

  /** DELETE /workspaces/:id */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.workspacesService.remove(id, user.id);
  }
}
