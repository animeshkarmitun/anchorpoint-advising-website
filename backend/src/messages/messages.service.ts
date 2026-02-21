import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
    private readonly logger = new Logger(MessagesService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Get or Create Conversation ────────────────────

    private async getOrCreateConversation(userA: string, userB: string) {
        // Ensure order consistency
        const [participantA, participantB] = [userA, userB].sort();

        let conversation = await this.prisma.conversation.findUnique({
            where: {
                participantA_participantB: { participantA, participantB },
            },
        });

        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: { participantA, participantB },
            });
        }

        return conversation;
    }

    // ─── Customer: Get my Conversations ────────────────

    async getMyConversations(userId: string) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                OR: [{ participantA: userId }, { participantB: userId }],
            },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        // Get other participant info & unread count for each conversation
        const enriched = await Promise.all(
            conversations.map(async (c) => {
                const otherId = c.participantA === userId ? c.participantB : c.participantA;
                const other = await this.prisma.user.findUnique({
                    where: { id: otherId },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        profile: { select: { fullName: true } },
                    },
                });

                const unreadCount = await this.prisma.message.count({
                    where: { conversationId: c.id, receiverId: userId, read: false },
                });

                return {
                    id: c.id,
                    otherParticipant: other,
                    lastMessage: c.messages[0] || null,
                    lastMessageAt: c.lastMessageAt,
                    unreadCount,
                };
            }),
        );

        return {
            success: true,
            message: 'Conversations',
            data: enriched,
        };
    }

    // ─── Get Messages in a Conversation ────────────────

    async getMessages(userId: string, conversationId: string, page = 1, limit = 50) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                OR: [{ participantA: userId }, { participantB: userId }],
            },
        });

        if (!conversation) throw new NotFoundException('Conversation not found');

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.message.count({ where: { conversationId } }),
        ]);

        // Mark as read
        await this.prisma.message.updateMany({
            where: { conversationId, receiverId: userId, read: false },
            data: { read: true, readAt: new Date() },
        });

        return {
            success: true,
            message: 'Messages',
            data: messages.reverse(), // Chronological order
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Send Message ──────────────────────────────────

    async sendMessage(
        senderId: string,
        receiverId: string,
        content: string,
        attachmentKey?: string,
    ) {
        const conversation = await this.getOrCreateConversation(senderId, receiverId);

        const message = await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId,
                receiverId,
                content,
                attachmentKey,
            },
        });

        // Update conversation timestamp
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() },
        });

        // Create notification for recipient
        const sender = await this.prisma.user.findUnique({
            where: { id: senderId },
            select: {
                email: true,
                profile: { select: { fullName: true } },
            },
        });

        await this.prisma.notification.create({
            data: {
                userId: receiverId,
                type: 'message',
                title: 'New Message 💬',
                body: `${sender?.profile?.fullName || sender?.email}: ${content.substring(0, 80)}`,
                link: `/messages/${conversation.id}`,
            },
        });

        return {
            success: true,
            message: 'Message sent',
            data: message,
        };
    }

    // ─── Mark Read ─────────────────────────────────────

    async markConversationRead(userId: string, conversationId: string) {
        const result = await this.prisma.message.updateMany({
            where: { conversationId, receiverId: userId, read: false },
            data: { read: true, readAt: new Date() },
        });

        return {
            success: true,
            message: `${result.count} messages marked as read`,
            data: { count: result.count },
        };
    }

    // ─── Admin: Broadcast ──────────────────────────────

    async broadcastNotification(
        adminId: string,
        title: string,
        body: string,
        link?: string,
    ) {
        // Get all customers
        const customers = await this.prisma.user.findMany({
            where: { role: 'CUSTOMER', status: 'ACTIVE' },
            select: { id: true },
        });

        const result = await this.prisma.notification.createMany({
            data: customers.map((c) => ({
                userId: c.id,
                type: 'broadcast',
                title,
                body,
                link,
            })),
        });

        this.logger.log(`Broadcast sent to ${result.count} customers by ${adminId}`);

        return {
            success: true,
            message: `Broadcast sent to ${result.count} customers`,
            data: { count: result.count },
        };
    }
}
