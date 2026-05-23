import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly useR2: boolean;
  private readonly uploadDir: string;

  // R2 / S3-compatible config
  private readonly r2Client: S3Client | null;
  private readonly r2Bucket: string;
  private readonly r2PublicUrl: string;
  private readonly r2Prefix: string = 'anchor'; // All files stored under anchor/

  constructor(private readonly configService: ConfigService) {
    this.r2Bucket = this.configService.get<string>('R2_BUCKET_NAME', '');
    this.r2PublicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

    const accountId = this.configService.get<string>('R2_ACCOUNT_ID', '');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
      '',
    );

    // Enable R2 mode if all credentials are present
    this.useR2 = !!(this.r2Bucket && accountId && accessKeyId && secretAccessKey);

    if (this.useR2) {
      this.r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(
        `☁️  Storage mode: Cloudflare R2 (bucket: ${this.r2Bucket}, prefix: ${this.r2Prefix}/)`,
      );
    } else {
      this.r2Client = null;
      this.logger.log('📁 Storage mode: Local filesystem');
      // Ensure upload directory exists
      const absPath = path.resolve(this.uploadDir);
      if (!fs.existsSync(absPath)) {
        fs.mkdirSync(absPath, { recursive: true });
        this.logger.log(`Created upload directory: ${absPath}`);
      }
    }
  }

  /**
   * Upload a file — uses Cloudflare R2 if configured, otherwise local filesystem.
   * All R2 files are stored under the `anchor/` prefix to isolate them from
   * other projects sharing the same bucket.
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    const fileKey = `${folder}/${uniqueName}`;

    if (this.useR2 && this.r2Client) {
      return this.uploadToR2(file, fileKey);
    }
    return this.uploadToLocal(file, fileKey);
  }

  /**
   * Delete a file by its key
   */
  async deleteFile(fileKey: string): Promise<void> {
    if (this.useR2 && this.r2Client) {
      return this.deleteFromR2(fileKey);
    }
    return this.deleteFromLocal(fileKey);
  }

  /**
   * Get a public URL for accessing a file
   */
  getFileUrl(fileKey: string): string {
    if (this.useR2) {
      // R2 public URL with the anchor/ prefix
      const fullKey = `${this.r2Prefix}/${fileKey}`;
      return `${this.r2PublicUrl}/${fullKey}`;
    }
    // Local: served via ServeStaticModule at /uploads
    return `/uploads/${fileKey}`;
  }

  /**
   * Check if using R2 cloud storage
   */
  isCloudMode(): boolean {
    return this.useR2;
  }

  // ─── Private: Cloudflare R2 ─────────────────────────────

  private async uploadToR2(
    file: Express.Multer.File,
    fileKey: string,
  ): Promise<UploadResult> {
    // Prepend the project prefix so files are isolated under anchor/
    const fullKey = `${this.r2Prefix}/${fileKey}`;

    const command = new PutObjectCommand({
      Bucket: this.r2Bucket,
      Key: fullKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.r2Client!.send(command);
    this.logger.debug(`☁️  Uploaded to R2: ${fullKey}`);

    return {
      fileKey,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      url: this.getFileUrl(fileKey),
    };
  }

  private async deleteFromR2(fileKey: string): Promise<void> {
    const fullKey = `${this.r2Prefix}/${fileKey}`;

    const command = new DeleteObjectCommand({
      Bucket: this.r2Bucket,
      Key: fullKey,
    });

    await this.r2Client!.send(command);
    this.logger.debug(`🗑️  Deleted from R2: ${fullKey}`);
  }

  // ─── Private: Local filesystem ──────────────────────────

  private async uploadToLocal(
    file: Express.Multer.File,
    fileKey: string,
  ): Promise<UploadResult> {
    const absDir = path.resolve(this.uploadDir, path.dirname(fileKey));
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }

    const absPath = path.resolve(this.uploadDir, fileKey);
    fs.writeFileSync(absPath, file.buffer);

    this.logger.debug(`📁 Saved locally: ${absPath}`);

    return {
      fileKey,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      url: this.getFileUrl(fileKey),
    };
  }

  private async deleteFromLocal(fileKey: string): Promise<void> {
    const absPath = path.resolve(this.uploadDir, fileKey);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      this.logger.debug(`🗑️ Deleted locally: ${absPath}`);
    }
  }
}
