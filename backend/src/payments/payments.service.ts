import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    InitiatePaymentDto,
    RequestRefundDto,
    ProcessRefundDto,
    QueryPaymentsDto,
} from './dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Customer: Initiate Payment ────────────────────

    async initiatePayment(userId: string, dto: InitiatePaymentDto) {
        // Validate coupon if provided
        let coupon: any = null;
        let discountAmount = new Prisma.Decimal(0);

        if (dto.couponCode) {
            coupon = await this.prisma.coupon.findUnique({
                where: { code: dto.couponCode },
            });

            if (!coupon || !coupon.active) {
                throw new BadRequestException('Invalid or expired coupon code');
            }

            if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                throw new BadRequestException('Coupon has expired');
            }

            if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
                throw new BadRequestException('Coupon has been fully redeemed');
            }

            if (coupon.minAmount && dto.amount < Number(coupon.minAmount)) {
                throw new BadRequestException(
                    `Minimum amount for this coupon is BDT ${coupon.minAmount}`,
                );
            }

            // Calculate discount
            if (coupon.discountType === 'percentage') {
                discountAmount = new Prisma.Decimal(
                    (dto.amount * Number(coupon.discountValue)) / 100,
                );
            } else {
                discountAmount = coupon.discountValue;
            }
        }

        const finalAmount = new Prisma.Decimal(dto.amount).minus(discountAmount);

        const payment = await this.prisma.payment.create({
            data: {
                userId,
                filingId: dto.filingId || null,
                consultationId: dto.consultationId || null,
                amount: finalAmount,
                method: dto.method,
                status: 'PENDING',
                couponId: coupon?.id || null,
                discountAmount: discountAmount.gt(0) ? discountAmount : null,
            },
        });

        // Increment coupon usage
        if (coupon) {
            await this.prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }

        this.logger.log(`Payment initiated: ${payment.id} — BDT ${finalAmount}`);

        // In production: redirect to payment gateway here
        return {
            success: true,
            message: 'Payment initiated',
            data: {
                payment,
                gatewayRedirectUrl: null, // Will be populated when gateway is integrated
            },
        };
    }

    // ─── Customer: My Payments ─────────────────────────

    async getMyPayments(userId: string, query: QueryPaymentsDto) {
        const where: any = { userId };
        if (query.status) where.status = query.status;
        if (query.method) where.method = query.method;
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [payments, total, totalSpent] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    invoice: { select: { id: true, invoiceNo: true } },
                    coupon: { select: { code: true, discountType: true } },
                },
            }),
            this.prisma.payment.count({ where }),
            this.prisma.payment.aggregate({
                where: { userId, status: 'COMPLETED' },
                _sum: { amount: true },
            }),
        ]);

        return {
            success: true,
            message: 'Payments retrieved',
            data: payments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalSpent: totalSpent._sum.amount || 0,
            },
        };
    }

    // ─── Customer: Request Refund ──────────────────────

    async requestRefund(userId: string, paymentId: string, dto: RequestRefundDto) {
        const payment = await this.prisma.payment.findFirst({
            where: { id: paymentId, userId, status: 'COMPLETED' },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found or not eligible for refund');
        }

        // Check for existing refund
        const existingRefund = await this.prisma.refund.findFirst({
            where: { paymentId, status: { not: 'rejected' } },
        });

        if (existingRefund) {
            throw new ConflictException('A refund request already exists for this payment');
        }

        const refund = await this.prisma.refund.create({
            data: {
                paymentId,
                amount: payment.amount,
                reason: dto.reason,
                status: 'pending',
            },
        });

        // Notify admins
        const admins = await this.prisma.user.findMany({
            where: { role: { in: ['SUPER_ADMIN', 'OPERATIONS'] } },
            select: { id: true },
        });

        if (admins.length > 0) {
            await this.prisma.notification.createMany({
                data: admins.map((a) => ({
                    userId: a.id,
                    type: 'payment',
                    title: 'New Refund Request 💰',
                    body: `Refund request for BDT ${payment.amount}: ${dto.reason.substring(0, 80)}`,
                    link: `/admin/payments/${paymentId}`,
                })),
            });
        }

        return {
            success: true,
            message: 'Refund request submitted',
            data: refund,
        };
    }

    // ═══════════════════════════════════════════════
    //  Admin
    // ═══════════════════════════════════════════════

    async getAllPayments(query: QueryPaymentsDto) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.method) where.method = query.method;
        if (query.dateFrom || query.dateTo) {
            where.createdAt = {};
            if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
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
                    invoice: { select: { invoiceNo: true } },
                    refunds: true,
                },
            }),
            this.prisma.payment.count({ where }),
        ]);

        return {
            success: true,
            message: 'All payments',
            data: payments,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async getRefundQueue() {
        const refunds = await this.prisma.refund.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
            include: {
                payment: {
                    include: {
                        user: {
                            select: {
                                email: true,
                                profile: { select: { fullName: true } },
                            },
                        },
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Refund queue',
            data: refunds,
        };
    }

    async processRefund(refundId: string, dto: ProcessRefundDto, adminId: string) {
        const refund = await this.prisma.refund.findUnique({
            where: { id: refundId },
            include: { payment: true },
        });

        if (!refund) throw new NotFoundException('Refund not found');
        if (refund.status !== 'pending') {
            throw new BadRequestException('Only pending refunds can be processed');
        }

        const updated = await this.prisma.refund.update({
            where: { id: refundId },
            data: {
                status: dto.status,
                amount: dto.amount ? new Prisma.Decimal(dto.amount) : refund.amount,
                processedBy: adminId,
            },
        });

        if (dto.status === 'approved') {
            // Update payment status
            const isPartial = dto.amount && dto.amount < Number(refund.payment.amount);
            await this.prisma.payment.update({
                where: { id: refund.paymentId },
                data: {
                    status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
                },
            });
        }

        // Notify customer
        await this.prisma.notification.create({
            data: {
                userId: refund.payment.userId,
                type: 'payment',
                title: dto.status === 'approved'
                    ? 'Refund Approved ✅'
                    : 'Refund Rejected ❌',
                body: dto.status === 'approved'
                    ? `Your refund of BDT ${updated.amount} has been approved.`
                    : `Your refund request was rejected${dto.reason ? `: ${dto.reason}` : ''}.`,
                link: `/payments`,
            },
        });

        return {
            success: true,
            message: `Refund ${dto.status}`,
            data: updated,
        };
    }

    async getRevenueStats() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const [monthRevenue, yearRevenue, total, byMethod, byStatus] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED', createdAt: { gte: startOfYear } },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.payment.groupBy({
                by: ['method'],
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.payment.groupBy({
                by: ['status'],
                _count: true,
            }),
        ]);

        return {
            success: true,
            message: 'Revenue statistics',
            data: {
                thisMonth: {
                    revenue: monthRevenue._sum.amount || 0,
                    count: monthRevenue._count,
                },
                thisYear: {
                    revenue: yearRevenue._sum.amount || 0,
                    count: yearRevenue._count,
                },
                allTime: {
                    revenue: total._sum.amount || 0,
                    count: total._count,
                },
                byMethod: byMethod.map((m) => ({
                    method: m.method,
                    revenue: m._sum.amount || 0,
                    count: m._count,
                })),
                byStatus: byStatus.map((s) => ({
                    status: s.status,
                    count: s._count,
                })),
            },
        };
    }
}
