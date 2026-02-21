import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    Body,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, QueryDocumentsDto } from './dto';

@ApiTags('Customer: Documents')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    // ─── Upload Document ───────────────────────────────

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Upload a document',
        description:
            'Upload a document (PDF, JPG, PNG, DOCX). Max 10 MB. Associates with a category and optionally a filing.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                category: {
                    type: 'string',
                    enum: [
                        'NID', 'TIN_CERTIFICATE', 'SALARY_CERTIFICATE', 'BANK_STATEMENT',
                        'RENTAL_AGREEMENT', 'INVESTMENT_PROOF', 'PREVIOUS_RETURN',
                        'TRADE_LICENSE', 'ASSET_STATEMENT', 'FILED_RETURN',
                        'ACKNOWLEDGEMENT', 'OTHER',
                    ],
                },
                filingId: { type: 'string', nullable: true },
            },
            required: ['file', 'category'],
        },
    })
    @ApiResponse({ status: 201, description: 'Document uploaded' })
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    async uploadDocument(
        @CurrentUser('id') userId: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
                    new FileTypeValidator({
                        fileType: /(pdf|jpg|jpeg|png|docx)$/i,
                    }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: UploadDocumentDto,
    ) {
        return this.documentsService.uploadDocument(userId, file, dto);
    }

    // ─── List My Documents ─────────────────────────────

    @Get()
    @ApiOperation({
        summary: 'List my documents',
        description: 'List all documents uploaded by the authenticated user. Supports filtering and pagination.',
    })
    @ApiResponse({ status: 200, description: 'Documents list' })
    async getMyDocuments(
        @CurrentUser('id') userId: string,
        @Query() query: QueryDocumentsDto,
    ) {
        return this.documentsService.getMyDocuments(userId, query);
    }

    // ─── Get Document Details ──────────────────────────

    @Get(':id')
    @ApiOperation({ summary: 'Get document details with version history' })
    @ApiResponse({ status: 200, description: 'Document details' })
    async getDocument(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.documentsService.getDocument(userId, id);
    }

    // ─── Download Document ─────────────────────────────

    @Get(':id/download')
    @ApiOperation({
        summary: 'Get document download URL',
        description: 'Returns a URL to download the document. URL expires in 15 minutes.',
    })
    @ApiResponse({ status: 200, description: 'Download URL' })
    async downloadDocument(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.documentsService.getDownloadUrl(userId, id);
    }

    // ─── Re-Upload (New Version) ───────────────────────

    @Post(':id/reupload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Re-upload a rejected document',
        description:
            'Upload a corrected version for a REJECTED or NEEDS_REUPLOAD document. Creates a new version.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
        },
    })
    @ApiResponse({ status: 201, description: 'New version uploaded' })
    @ApiResponse({ status: 400, description: 'Document not eligible for re-upload' })
    async reuploadDocument(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(pdf|jpg|jpeg|png|docx)$/i }),
                ],
            }),
        )
        file: Express.Multer.File,
    ) {
        return this.documentsService.reuploadDocument(userId, id, file);
    }

    // ─── Delete Document ───────────────────────────────

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete a document',
        description: 'Delete a pending or rejected document. Accepted documents cannot be deleted.',
    })
    @ApiResponse({ status: 200, description: 'Document deleted' })
    @ApiResponse({ status: 403, description: 'Cannot delete accepted document' })
    async deleteDocument(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.documentsService.deleteDocument(userId, id);
    }

    // ─── Document Checklist ────────────────────────────

    @Get('checklist/:filingId')
    @ApiOperation({
        summary: 'Get document checklist for a filing',
        description:
            'Returns a checklist of required documents based on the filing type, showing status per category.',
    })
    @ApiResponse({ status: 200, description: 'Document checklist with completion rate' })
    async getChecklist(
        @CurrentUser('id') userId: string,
        @Param('filingId') filingId: string,
    ) {
        return this.documentsService.getChecklist(userId, filingId);
    }
}
