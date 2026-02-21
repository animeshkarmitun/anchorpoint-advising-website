import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { AdminDocumentsController } from './admin-documents.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [
        MulterModule.register({ storage: memoryStorage() }),
        UploadModule,
    ],
    controllers: [DocumentsController, AdminDocumentsController],
    providers: [DocumentsService],
    exports: [DocumentsService],
})
export class DocumentsModule { }
