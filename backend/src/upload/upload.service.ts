import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
    fileKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
}

@Injectable()
export class UploadService {
    private readonly logger = new Logger(UploadService.name);
    private readonly useS3: boolean;
    private readonly uploadDir: string;
    private readonly s3Bucket: string;
    private readonly s3Region: string;

    constructor(private readonly configService: ConfigService) {
        this.s3Bucket = this.configService.get<string>('AWS_S3_BUCKET', '');
        this.s3Region = this.configService.get<string>('AWS_S3_REGION', '');
        this.useS3 = !!this.s3Bucket;
        this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

        if (this.useS3) {
            this.logger.log('📦 Storage mode: AWS S3');
        } else {
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
     * Upload a file — uses S3 if configured, otherwise local filesystem
     */
    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'general',
    ): Promise<UploadedFile> {
        const ext = path.extname(file.originalname);
        const uniqueName = `${uuidv4()}${ext}`;
        const fileKey = `${folder}/${uniqueName}`;

        if (this.useS3) {
            return this.uploadToS3(file, fileKey);
        }
        return this.uploadToLocal(file, fileKey);
    }

    /**
     * Delete a file by its key
     */
    async deleteFile(fileKey: string): Promise<void> {
        if (this.useS3) {
            return this.deleteFromS3(fileKey);
        }
        return this.deleteFromLocal(fileKey);
    }

    /**
     * Get a URL for accessing a file
     */
    getFileUrl(fileKey: string): string {
        if (this.useS3) {
            return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${fileKey}`;
        }
        // Local: served via ServeStaticModule at /uploads
        return `/uploads/${fileKey}`;
    }

    /**
     * Check if using S3
     */
    isS3Mode(): boolean {
        return this.useS3;
    }

    // ─── Private: Local filesystem ─────────────────────────

    private async uploadToLocal(
        file: Express.Multer.File,
        fileKey: string,
    ): Promise<UploadedFile> {
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

    // ─── Private: S3 (placeholder — wired up when AWS creds provided) ───

    private async uploadToS3(
        file: Express.Multer.File,
        fileKey: string,
    ): Promise<UploadedFile> {
        // TODO: Implement S3 upload with @aws-sdk/client-s3
        // For now, fall back to local
        this.logger.warn('S3 upload not yet implemented — falling back to local');
        return this.uploadToLocal(file, fileKey);
    }

    private async deleteFromS3(fileKey: string): Promise<void> {
        // TODO: Implement S3 delete with @aws-sdk/client-s3
        this.logger.warn('S3 delete not yet implemented');
    }
}
