import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VersionsService } from './versions.service';

@Controller('documents/:documentId/versions')
@UseGuards(AuthGuard('jwt'))
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  findAll(@Param('documentId') documentId: string) {
    return this.versionsService.findAll(documentId);
  }
}
