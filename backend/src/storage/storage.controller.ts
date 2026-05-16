import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StorageService } from './storage.service';

@Controller('storage')
@UseGuards(AuthGuard('jwt'))
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign/upload')
  async getUploadUrl(@Body() body: { key: string }) {
    const url = await this.storageService.getPresignedUploadUrl(body.key);
    return { url, key: body.key };
  }

  @Post('presign/download')
  async getDownloadUrl(@Body() body: { key: string }) {
    const url = await this.storageService.getPresignedDownloadUrl(body.key);
    return { url, key: body.key };
  }
}
