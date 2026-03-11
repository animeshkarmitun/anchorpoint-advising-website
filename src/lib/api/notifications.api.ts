import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Notification {
    id:        string;
    type:      string;
    title:     string;
    message:   string;
    isRead:    boolean;
    link?:     string | null;
    createdAt: string;
}

export interface NotificationsResponse {
    data:        Notification[];
    unreadCount: number;
    total:       number;
}

// ── Customer API ──────────────────────────────────────────────────────────────

export const notificationsApi = {
    /** Get my notifications */
    list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationsResponse> =>
        apiClient.get('/notifications', { params }).then((r) => r.data.data),

    /** Get unread count */
    getUnreadCount: (): Promise<{ count: number }> =>
        apiClient.get('/notifications/unread-count').then((r) => r.data.data),

    /** Mark single as read */
    markAsRead: (id: string) =>
        apiClient.put(`/notifications/${id}/read`).then((r) => r.data),

    /** Mark all as read */
    markAllAsRead: () =>
        apiClient.put('/notifications/read-all').then((r) => r.data),

    /** Delete a notification */
    delete: (id: string) =>
        apiClient.delete(`/notifications/${id}`).then((r) => r.data),
};
