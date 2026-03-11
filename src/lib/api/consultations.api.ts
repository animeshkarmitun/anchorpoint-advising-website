import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConsultationMedium = 'VIDEO' | 'PHONE' | 'IN_PERSON';
export type ConsultationStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface TimeSlot {
    time:      string;   // ISO string
    available: boolean;
}

export interface Consultation {
    id:           string;
    scheduledAt:  string;
    duration:     number;   // minutes
    medium:       ConsultationMedium;
    status:       ConsultationStatus;
    meetingLink?: string | null;
    notes?:       string | null;
    followUp?:    string | null;
    createdAt:    string;
    updatedAt:    string;
    advisor?: {
        id:    string;
        email: string;
        profile?: { fullName: string } | null;
    } | null;
}

// ── Customer API ──────────────────────────────────────────────────────────────

export const consultationsApi = {
    /** Get available time slots for a date */
    getSlots: (date: string): Promise<TimeSlot[]> =>
        apiClient.get('/consultations/slots', { params: { date } }).then((r) => r.data.data),

    /** Book a consultation */
    book: (dto: {
        scheduledAt: string;
        duration?: number;
        medium: ConsultationMedium;
        advisorId?: string;
    }) => apiClient.post('/consultations', dto).then((r) => r.data.data),

    /** My consultations */
    list: (params?: {
        status?: ConsultationStatus;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<Consultation[]> =>
        apiClient.get('/consultations', { params }).then((r) => r.data.data),

    /** Reschedule */
    reschedule: (id: string, scheduledAt: string) =>
        apiClient.put(`/consultations/${id}/reschedule`, { scheduledAt }).then((r) => r.data),

    /** Cancel */
    cancel: (id: string, reason: string) =>
        apiClient.put(`/consultations/${id}/cancel`, { reason }).then((r) => r.data),
};
