import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import {
    UploadDocumentDto,
    ReviewDocumentDto,
    QueryDocumentsDto,
    RequestDocumentDto,
} from './dto';

@Injectable()
export class DocumentsService {
    private readonly logger = new Logger(DocumentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
    ) { }

    // ─── Customer: Upload Document ─────────────────────

    async uploadDocument(
        userId: string,
        file: Express.Multer.File,
        dto: UploadDocumentDto,
    ) {
        // Validate filing ownership if filingId provided
        if (dto.filingId) {
            const filing = await this.prisma.filing.findFirst({
                where: { id: dto.filingId, userId },
            });
            if (!filing) {
                throw new BadRequestException('Filing not found or does not belong to you');
            }
        }

        // Upload file via upload service (S3 or local)
        const fileKey = `users/${userId}${dto.filingId ? `/filings/${dto.filingId}` : ''}/${dto.category}/${Date.now()}_${file.originalname}`;
        const uploadResult = await this.uploadService.uploadFile(file, fileKey);

        // Create document record
        const document = await this.prisma.document.create({
            data: {
                userId,
                filingId: dto.filingId || null,
                category: dto.category,
                fileName: file.originalname,
                fileKey: uploadResult.fileKey,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'PENDING',
            },
        });

        this.logger.log(`Document uploaded: ${document.id} by user ${userId}`);

        return {
            success: true,
            message: 'Document uploaded successfully',
            data: document,
        };
    }

    // ─── Customer: List My Documents ───────────────────

    async getMyDocuments(userId: string, query: QueryDocumentsDto) {
        const where: any = { userId, parentId: null }; // Only latest versions
        if (query.category) where.category = query.category;
        if (query.status) where.status = query.status;
        if (query.filingId) where.filingId = query.filingId;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    _count: { select: { versions: true } },
                },
            }),
            this.prisma.document.count({ where }),
        ]);

        return {
            success: true,
            message: 'Documents retrieved',
            data: documents,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── Customer: Get Single Document ─────────────────

    async getDocument(userId: string, documentId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, userId },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    select: {
                        id: true,
                        version: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        return {
            success: true,
            message: 'Document details',
            data: document,
        };
    }

    // ─── Customer: Download Document (presigned URL) ───

    async getDownloadUrl(userId: string, documentId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, userId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        const url = this.uploadService.getFileUrl(document.fileKey);

        return {
            success: true,
            message: 'Download URL generated',
            data: { url, expiresIn: '15 minutes' },
        };
    }

    // ─── Customer: Re-Upload (new version) ─────────────

    async reuploadDocument(
        userId: string,
        documentId: string,
        file: Express.Multer.File,
    ) {
        const original = await this.prisma.document.findFirst({
            where: { id: documentId, userId },
        });

        if (!original) {
            throw new NotFoundException('Document not found');
        }

        if (!['REJECTED', 'NEEDS_REUPLOAD'].includes(original.status)) {
            throw new BadRequestException(
                'Only rejected or needs-reupload documents can be re-uploaded',
            );
        }

        // Upload new file
        const fileKey = `users/${userId}${original.filingId ? `/filings/${original.filingId}` : ''}/${original.category}/${Date.now()}_${file.originalname}`;
        const uploadResult = await this.uploadService.uploadFile(file, fileKey);

        // Create new version
        const newVersion = await this.prisma.document.create({
            data: {
                userId,
                filingId: original.filingId,
                category: original.category,
                fileName: file.originalname,
                fileKey: uploadResult.fileKey,
                fileSize: file.size,
                mimeType: file.mimetype,
                status: 'PENDING',
                version: original.version + 1,
                parentId: original.parentId || original.id, // Point to root
            },
        });

        this.logger.log(
            `Document re-uploaded: ${newVersion.id} (v${newVersion.version}) for original ${documentId}`,
        );

        return {
            success: true,
            message: `New version (v${newVersion.version}) uploaded successfully`,
            data: newVersion,
        };
    }

    // ─── Customer: Delete Document ─────────────────────

    async deleteDocument(userId: string, documentId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id: documentId, userId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        if (document.status === 'ACCEPTED') {
            throw new ForbiddenException('Cannot delete an accepted document');
        }

        await this.prisma.document.delete({ where: { id: documentId } });

        return {
            success: true,
            message: 'Document deleted',
            data: null,
        };
    }

    // ─── Customer: Checklist ───────────────────────────

    async getChecklist(userId: string, filingId: string) {
        const filing = await this.prisma.filing.findFirst({
            where: { id: filingId, userId },
        });

        if (!filing) {
            throw new NotFoundException('Filing not found');
        }

        // Define required docs per service type
        const checklistMap: Record<string, string[]> = {
            individual: ['NID', 'TIN_CERTIFICATE', 'SALARY_CERTIFICATE', 'BANK_STATEMENT'],
            corporate: ['TRADE_LICENSE', 'TIN_CERTIFICATE', 'BANK_STATEMENT', 'ASSET_STATEMENT'],
            nrb: ['NID', 'TIN_CERTIFICATE', 'BANK_STATEMENT', 'ASSET_STATEMENT'],
        };

        const requiredCategories = checklistMap[filing.serviceType] || checklistMap.individual;

        // Fetch existing documents for this filing
        const documents = await this.prisma.document.findMany({
            where: { filingId, userId, parentId: null },
            select: {
                id: true,
                category: true,
                status: true,
                fileName: true,
                version: true,
            },
        });

        const checklist = requiredCategories.map((category) => {
            const doc = documents.find((d) => d.category === category);
            return {
                category,
                required: true,
                status: doc
                    ? doc.status
                    : 'NOT_UPLOADED',
                document: doc || null,
            };
        });

        return {
            success: true,
            message: 'Document checklist',
            data: {
                filingId,
                serviceType: filing.serviceType,
                assessmentYear: filing.assessmentYear,
                checklist,
                completionRate: Math.round(
                    (checklist.filter((c) => c.status === 'ACCEPTED').length / checklist.length) * 100,
                ),
            },
        };
    }

    // ═══════════════════════════════════════════════
    //  Admin Endpoints
    // ═══════════════════════════════════════════════

    // ─── Admin: Review Queue ───────────────────────────

    async getReviewQueue(query: QueryDocumentsDto) {
        const where: any = { status: 'PENDING', parentId: null };
        if (query.category) where.category = query.category;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                orderBy: { createdAt: 'asc' }, // Oldest first
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    filing: {
                        select: {
                            id: true,
                            assessmentYear: true,
                            deadline: true,
                            serviceType: true,
                        },
                    },
                },
            }),
            this.prisma.document.count({ where }),
        ]);

        return {
            success: true,
            message: 'Review queue',
            data: documents,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ─── Admin: Review (Approve/Reject) ────────────────

    async reviewDocument(
        documentId: string,
        dto: ReviewDocumentDto,
        reviewerId: string,
    ) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        if (document.status !== 'PENDING') {
            throw new BadRequestException('Only pending documents can be reviewed');
        }

        // Require rejection note for reject/reupload
        if (['REJECTED', 'NEEDS_REUPLOAD'].includes(dto.status) && !dto.rejectionNote) {
            throw new BadRequestException(
                'Rejection note is required when rejecting or requesting re-upload',
            );
        }

        const updated = await this.prisma.document.update({
            where: { id: documentId },
            data: {
                status: dto.status,
                rejectionNote: dto.rejectionNote || null,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
            },
        });

        // Create notification for customer
        const notifTitleMap: Record<string, string> = {
            ACCEPTED: 'Document Approved ✅',
            REJECTED: 'Document Rejected ❌',
            NEEDS_REUPLOAD: 'Document Needs Re-upload 🔄',
        };

        await this.prisma.notification.create({
            data: {
                userId: document.userId,
                type: 'document_status',
                title: notifTitleMap[dto.status] || 'Document Update',
                body: dto.status === 'ACCEPTED'
                    ? `Your ${document.category} document has been accepted.`
                    : `Your ${document.category} document: ${dto.rejectionNote}`,
                link: `/documents/${documentId}`,
            },
        });

        // Audit log
        await this.prisma.auditLog.create({
            data: {
                userId: reviewerId,
                action: 'REVIEW',
                entity: 'Document',
                entityId: documentId,
                oldValue: { status: document.status },
                newValue: { status: dto.status, note: dto.rejectionNote },
            },
        });

        this.logger.log(
            `Document ${documentId} reviewed: ${document.status} → ${dto.status} by ${reviewerId}`,
        );

        return {
            success: true,
            message: `Document ${dto.status.toLowerCase().replace('_', ' ')}`,
            data: updated,
        };
    }

    // ─── Admin: Request Additional Document ────────────

    async requestDocument(dto: RequestDocumentDto, requesterId: string) {
        // Verify user exists
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user) {
            throw new NotFoundException('Customer not found');
        }

        // Send notification to customer
        await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: 'document_request',
                title: 'Document Requested 📋',
                body: `Please upload: ${dto.category.replace(/_/g, ' ')}. ${dto.note}`,
                link: dto.filingId ? `/filings/${dto.filingId}/documents` : '/documents',
            },
        });

        this.logger.log(
            `Document requested from ${dto.userId}: ${dto.category} by ${requesterId}`,
        );

        return {
            success: true,
            message: 'Document request sent to customer',
            data: {
                userId: dto.userId,
                category: dto.category,
                note: dto.note,
            },
        };
    }

    // ─── Admin: Get All Documents (with filters) ───────

    async getAllDocuments(query: QueryDocumentsDto) {
        const where: any = { parentId: null };
        if (query.category) where.category = query.category;
        if (query.status) where.status = query.status;
        if (query.filingId) where.filingId = query.filingId;

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [documents, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    filing: {
                        select: { assessmentYear: true, serviceType: true },
                    },
                },
            }),
            this.prisma.document.count({ where }),
        ]);

        return {
            success: true,
            message: 'All documents',
            data: documents,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Admin: Download (any document) ────────────────

    async adminGetDownloadUrl(documentId: string) {
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        const url = this.uploadService.getFileUrl(document.fileKey);

        return {
            success: true,
            message: 'Download URL',
            data: { url, expiresIn: '15 minutes' },
        };
    }
}
