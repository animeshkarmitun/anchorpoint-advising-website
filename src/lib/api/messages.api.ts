import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
    id:            string;
    lastMessage?:  string | null;
    lastMessageAt?: string | null;
    unreadCount:   number;
    createdAt:     string;
    participants:  {
        id:    string;
        email: string;
        role:  string;
        profile?: { fullName: string } | null;
    }[];
}

export interface Message {
    id:            string;
    content:       string;
    senderId:      string;
    conversationId: string;
    attachmentKey?: string | null;
    isRead:        boolean;
    createdAt:     string;
    sender?: {
        id:    string;
        email: string;
        role:  string;
        profile?: { fullName: string } | null;
    };
}

// ── Customer API ──────────────────────────────────────────────────────────────

export const messagesApi = {
    /** Get my conversations */
    getConversations: (): Promise<Conversation[]> =>
        apiClient.get('/messages/conversations').then((r) => r.data.data),

    /** Get messages in a conversation */
    getMessages: (conversationId: string, page = 1, limit = 50): Promise<Message[]> =>
        apiClient.get(`/messages/conversations/${conversationId}`, { params: { page, limit } })
            .then((r) => r.data.data),

    /** Send a message */
    send: (receiverId: string, content: string, attachmentKey?: string) =>
        apiClient.post('/messages/send', { receiverId, content, attachmentKey })
            .then((r) => r.data.data),

    /** Mark conversation as read */
    markRead: (conversationId: string) =>
        apiClient.put(`/messages/conversations/${conversationId}/read`)
            .then((r) => r.data),
};
