import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Query,
    Body,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { ReviewDocumentDto, QueryDocumentsDto, RequestDocumentDto } from './dto';

@ApiTags('Admin: Documents')
@ApiBearerAuth('JWT-auth')
@Controller('admin/documents')
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS, Role.TAX_ADVISOR)
export class AdminDocumentsController {
    constructor(private readonly documentsService: DocumentsService) { }

    // ─── Review Queue ──────────────────────────────────

    @Get('review-queue')
    @ApiOperation({
        summary: 'Get document review queue',
        description: 'List all pending documents across all customers, sorted oldest first.',
    })
    @ApiResponse({ status: 200, description: 'Review queue' })
    async getReviewQueue(@Query() query: QueryDocumentsDto) {
        return this.documentsService.getReviewQueue(query);
    }

    // ─── Review (Approve/Reject) ───────────────────────

    @Put(':id/review')
    @ApiOperation({
        summary: 'Review a document (approve/reject)',
        description:
            'Change document status to ACCEPTED, REJECTED, or NEEDS_REUPLOAD. Rejection requires a note.',
    })
    @ApiResponse({ status: 200, description: 'Document reviewed' })
    @ApiResponse({ status: 400, description: 'Document not in PENDING status' })
    async reviewDocument(
        @Param('id') id: string,
        @Body() dto: ReviewDocumentDto,
        @CurrentUser('id') reviewerId: string,
    ) {
        return this.documentsService.reviewDocument(id, dto, reviewerId);
    }

    // ─── Request Additional Document ───────────────────

    @Post('request')
    @ApiOperation({
        summary: 'Request additional documents from a customer',
        description: 'Send a document request notification to a specific customer.',
    })
    @ApiResponse({ status: 201, description: 'Request sent' })
    async requestDocument(
        @Body() dto: RequestDocumentDto,
        @CurrentUser('id') requesterId: string,
    ) {
        return this.documentsService.requestDocument(dto, requesterId);
    }

    // ─── All Documents (with filters) ──────────────────

    @Get()
    @ApiOperation({
        summary: 'List all documents (admin view)',
        description: 'Browse all customer documents with filtering by category, status, and filing.',
    })
    @ApiResponse({ status: 200, description: 'Documents list' })
    async getAllDocuments(@Query() query: QueryDocumentsDto) {
        return this.documentsService.getAllDocuments(query);
    }

    // ─── Download Any Document ─────────────────────────

    @Get(':id/download')
    @ApiOperation({
        summary: 'Get download URL for any document',
        description: 'Admin can download any customer document.',
    })
    @ApiResponse({ status: 200, description: 'Download URL' })
    async downloadDocument(@Param('id') id: string) {
        return this.documentsService.adminGetDownloadUrl(id);
    }
}
