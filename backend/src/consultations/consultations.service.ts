import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    BookConsultationDto,
    RescheduleConsultationDto,
    CancelConsultationDto,
    AddConsultationNotesDto,
    UpdateConsultationStatusDto,
    QueryConsultationsDto,
} from './dto';

@Injectable()
export class ConsultationsService {
    private readonly logger = new Logger(ConsultationsService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Customer: Available Slots ─────────────────────

    async getAvailableSlots(date: string) {
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();

        // Get all advisor schedules for this day of the week
        const schedules = await this.prisma.advisorSchedule.findMany({
            where: { dayOfWeek, active: true },
        });

        // Check for exceptions
        const exceptions = await this.prisma.scheduleException.findMany({
            where: {
                date: {
                    gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    lt: new Date(targetDate.setHours(23, 59, 59, 999)),
                },
            },
        });

        // Get existing bookings for this date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const existingBookings = await this.prisma.consultation.findMany({
            where: {
                scheduledAt: { gte: startOfDay, lte: endOfDay },
                status: { in: ['SCHEDULED', 'CONFIRMED'] },
            },
            select: { scheduledAt: true, duration: true, advisorId: true },
        });

        // Generate available slots
        const slots: Array<{ time: string; advisorId: string; available: boolean }> = [];

        for (const schedule of schedules) {
            // Check if advisor has exception for this date
            const exception = exceptions.find(
                (e) => e.advisorId === schedule.advisorId,
            );
            if (exception && !exception.available) continue;

            // Generate time slots
            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const [endHour, endMin] = schedule.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            for (let m = startMinutes; m + schedule.slotDuration <= endMinutes; m += schedule.slotDuration) {
                const hour = Math.floor(m / 60);
                const min = m % 60;
                const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

                // Check if slot is already booked
                const slotTime = new Date(date);
                slotTime.setHours(hour, min, 0, 0);
                const isBooked = existingBookings.some(
                    (b) =>
                        b.advisorId === schedule.advisorId &&
                        Math.abs(new Date(b.scheduledAt).getTime() - slotTime.getTime()) <
                        schedule.slotDuration * 60 * 1000,
                );

                slots.push({
                    time: timeStr,
                    advisorId: schedule.advisorId,
                    available: !isBooked,
                });
            }
        }

        return {
            success: true,
            message: 'Available slots',
            data: {
                date,
                slots: slots.filter((s) => s.available),
                totalSlots: slots.length,
                availableCount: slots.filter((s) => s.available).length,
            },
        };
    }

    // ─── Customer: Book Consultation ───────────────────

    async bookConsultation(clientId: string, dto: BookConsultationDto) {
        // Find available advisor
        let advisorId = dto.advisorId;

        if (!advisorId) {
            // Auto-assign: find advisor with least upcoming consultations
            const advisors = await this.prisma.user.findMany({
                where: { role: 'TAX_ADVISOR', status: 'ACTIVE' },
                select: {
                    id: true,
                    _count: {
                        select: {
                            consultationsAsAdvisor: {
                                where: { status: { in: ['SCHEDULED', 'CONFIRMED'] } },
                            },
                        },
                    },
                },
            });

            if (advisors.length === 0) {
                throw new BadRequestException('No advisors available');
            }

            advisorId = advisors.sort(
                (a, b) => a._count.consultationsAsAdvisor - b._count.consultationsAsAdvisor,
            )[0].id;
        }

        const consultation = await this.prisma.consultation.create({
            data: {
                clientId,
                advisorId,
                scheduledAt: new Date(dto.scheduledAt),
                duration: dto.duration || 30,
                medium: dto.medium,
                status: 'SCHEDULED',
                meetingLink: dto.medium === 'VIDEO' ? `https://meet.google.com/placeholder-${Date.now()}` : null,
            },
            include: {
                advisor: {
                    select: {
                        email: true,
                        profile: { select: { fullName: true } },
                    },
                },
            },
        });

        // Notify both parties
        await this.prisma.notification.createMany({
            data: [
                {
                    userId: clientId,
                    type: 'consultation',
                    title: 'Consultation Booked ✅',
                    body: `Your ${dto.medium.toLowerCase()} consultation is scheduled for ${new Date(dto.scheduledAt).toLocaleString()}.`,
                    link: `/consultations/${consultation.id}`,
                },
                {
                    userId: advisorId,
                    type: 'consultation',
                    title: 'New Consultation Booking 📅',
                    body: `A new ${dto.medium.toLowerCase()} consultation has been scheduled.`,
                    link: `/admin/consultations/${consultation.id}`,
                },
            ],
        });

        this.logger.log(`Consultation booked: ${consultation.id}`);

        return {
            success: true,
            message: 'Consultation booked',
            data: consultation,
        };
    }

    // ─── Customer: My Consultations ────────────────────

    async getMyConsultations(clientId: string, query: QueryConsultationsDto) {
        const where: any = { clientId };
        if (query.status) where.status = query.status;
        if (query.dateFrom || query.dateTo) {
            where.scheduledAt = {};
            if (query.dateFrom) where.scheduledAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.scheduledAt.lte = new Date(query.dateTo);
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [consultations, total] = await Promise.all([
            this.prisma.consultation.findMany({
                where,
                orderBy: { scheduledAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    advisor: {
                        select: {
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                },
            }),
            this.prisma.consultation.count({ where }),
        ]);

        return {
            success: true,
            message: 'Consultations',
            data: consultations,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Customer: Reschedule ──────────────────────────

    async rescheduleConsultation(
        clientId: string,
        consultationId: string,
        dto: RescheduleConsultationDto,
    ) {
        const consultation = await this.prisma.consultation.findFirst({
            where: { id: consultationId, clientId, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
        });

        if (!consultation) {
            throw new NotFoundException('Consultation not found or cannot be rescheduled');
        }

        // Check 2-hour window
        const hoursUntil = (new Date(consultation.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < 2) {
            throw new BadRequestException('Cannot reschedule less than 2 hours before the appointment');
        }

        const updated = await this.prisma.consultation.update({
            where: { id: consultationId },
            data: { scheduledAt: new Date(dto.scheduledAt) },
        });

        return {
            success: true,
            message: 'Consultation rescheduled',
            data: updated,
        };
    }

    // ─── Customer: Cancel ──────────────────────────────

    async cancelConsultation(
        clientId: string,
        consultationId: string,
        dto: CancelConsultationDto,
    ) {
        const consultation = await this.prisma.consultation.findFirst({
            where: { id: consultationId, clientId, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
        });

        if (!consultation) {
            throw new NotFoundException('Consultation not found or cannot be cancelled');
        }

        const updated = await this.prisma.consultation.update({
            where: { id: consultationId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancelReason: dto.reason,
            },
        });

        return {
            success: true,
            message: 'Consultation cancelled',
            data: updated,
        };
    }

    // ═══════════════════════════════════════════════
    //  Admin
    // ═══════════════════════════════════════════════

    async getAllConsultations(query: QueryConsultationsDto) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.dateFrom || query.dateTo) {
            where.scheduledAt = {};
            if (query.dateFrom) where.scheduledAt.gte = new Date(query.dateFrom);
            if (query.dateTo) where.scheduledAt.lte = new Date(query.dateTo);
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [consultations, total] = await Promise.all([
            this.prisma.consultation.findMany({
                where,
                orderBy: { scheduledAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    client: {
                        select: {
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    advisor: {
                        select: {
                            email: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                },
            }),
            this.prisma.consultation.count({ where }),
        ]);

        return {
            success: true,
            message: 'All consultations',
            data: consultations,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async updateConsultationStatus(
        consultationId: string,
        dto: UpdateConsultationStatusDto,
    ) {
        const consultation = await this.prisma.consultation.findUnique({
            where: { id: consultationId },
        });

        if (!consultation) throw new NotFoundException('Consultation not found');

        const updated = await this.prisma.consultation.update({
            where: { id: consultationId },
            data: { status: dto.status },
        });

        return {
            success: true,
            message: `Status updated to ${dto.status}`,
            data: updated,
        };
    }

    async addNotes(consultationId: string, dto: AddConsultationNotesDto) {
        const consultation = await this.prisma.consultation.findUnique({
            where: { id: consultationId },
        });

        if (!consultation) throw new NotFoundException('Consultation not found');

        const updated = await this.prisma.consultation.update({
            where: { id: consultationId },
            data: {
                notes: dto.notes,
                followUp: dto.followUp,
            },
        });

        // Notify customer about notes
        await this.prisma.notification.create({
            data: {
                userId: consultation.clientId,
                type: 'consultation',
                title: 'Consultation Notes Available 📝',
                body: 'Your advisor has added notes from your consultation.',
                link: `/consultations/${consultationId}`,
            },
        });

        return {
            success: true,
            message: 'Notes added',
            data: updated,
        };
    }
}
