import apiClient from './client';

export interface Filing {
    id: string;
    assessmentYear: string;
    status: string;
    serviceType: string;
    deadline?: string | null;
    totalIncome?: number | null;
    taxPayable?: number | null;
    taxPaid?: number | null;
    refundAmount?: number | null;
    filedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    advisor?: {
        id: string;
        email: string;
        profile?: { fullName: string } | null;
    } | null;
}

export interface FilingStatusLog {
    id: string;
    from: string;
    to: string;
    note?: string | null;
    createdAt: string;
}

export const filingsApi = {
    // My filings
    list: () =>
        apiClient.get<{ data: Filing[] }>('/filings/my').then((r) => r.data.data),

    // Single filing
    get: (id: string) =>
        apiClient.get<{ data: Filing }>(`/filings/${id}`).then((r) => r.data.data),

    // Status history for timeline view
    getHistory: (id: string) =>
        apiClient.get<{ data: FilingStatusLog[] }>(`/filings/${id}/history`).then((r) => r.data.data),

    // Customer approves the prepared return
    approve: (id: string) =>
        apiClient.post(`/filings/${id}/approve`).then((r) => r.data),
};
