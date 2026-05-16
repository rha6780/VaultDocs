import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get('MINIO_BUCKET') ?? 'vaultdocs';
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT') ?? 'localhost',
      port: parseInt(this.config.get('MINIO_PORT') ?? '9000', 10),
      useSSL: this.config.get('MINIO_USE_SSL') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY') ?? '',
      secretKey: this.config.get('MINIO_SECRET_KEY') ?? '',
    });
  }

  async onModuleInit() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Bucket '${this.bucket}' created`);
    }
  }

  async getPresignedUploadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.client.presignedPutObject(this.bucket, key, expiresInSeconds);
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expiresInSeconds);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
