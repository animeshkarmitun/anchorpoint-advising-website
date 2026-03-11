import apiClient from './client';
import type { PaginatedResponse } from './admin.api';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'CASH' | 'CARD';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface Payment {
    id:            string;
    amount:        number;
    method:        PaymentMethod;
    status:        PaymentStatus;
    transactionId?: string | null;
    couponCode?:   string | null;
    discount?:     number | null;
    createdAt:     string;
    updatedAt:     string;
    filing?: {
        id:              string;
        assessmentYear:  string;
        serviceType:     string;
    } | null;
    consultation?: {
        id:          string;
        scheduledAt: string;
    } | null;
    refundRequest?: {
        id:        string;
        reason:    string;
        status:    string;
        createdAt: string;
    } | null;
}

export interface PaymentStats {
    totalRevenue:    number;
    monthlyRevenue:  number;
    pendingPayments: number;
    failedPayments:  number;
    refundsPending:  number;
}

export interface RefundRequest {
    id:        string;
    reason:    string;
    status:    string;
    amount:    number;
    createdAt: string;
    payment:   Payment;
    user?: {
        id:    string;
        email: string;
        profile?: { fullName: string } | null;
    } | null;
}

// ── Customer API ──────────────────────────────────────────────────────────────

export const paymentsApi = {
    /** Initiate a payment */
    initiate: (dto: {
        filingId?: string;
        consultationId?: string;
        amount: number;
        method: PaymentMethod;
        couponCode?: string;
    }) => apiClient.post('/payments', dto).then((r) => r.data.data),

    /** My payment history */
    list: (params?: {
        status?: PaymentStatus;
        method?: PaymentMethod;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<Payment>> =>
        apiClient.get('/payments', { params }).then((r) => r.data.data),

    /** Request a refund */
    requestRefund: (paymentId: string, reason: string) =>
        apiClient.post(`/payments/${paymentId}/refund`, { reason }).then((r) => r.data),
};

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminPaymentsApi = {
    /** All payments (admin view) */
    list: (params?: {
        status?: PaymentStatus;
        method?: PaymentMethod;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        limit?: number;
    }): Promise<PaginatedResponse<Payment & { user?: { id: string; email: string; profile?: { fullName: string } | null } }>> =>
        apiClient.get('/admin/payments', { params }).then((r) => r.data.data),

    /** Revenue stats */
    getStats: (): Promise<PaymentStats> =>
        apiClient.get('/admin/payments/stats').then((r) => r.data.data),

    /** Pending refunds */
    getRefundQueue: (): Promise<RefundRequest[]> =>
        apiClient.get('/admin/payments/refunds').then((r) => r.data.data),

    /** Process a refund */
    processRefund: (refundId: string, dto: { status: 'approved' | 'rejected'; amount?: number; reason?: string }) =>
        apiClient.put(`/admin/payments/refunds/${refundId}`, dto).then((r) => r.data),
};
