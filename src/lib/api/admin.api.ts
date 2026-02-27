import apiClient from './client';
import type { AuthUser } from '@/lib/store/auth.store';

// ── Dashboard stats ────────────────────────────────────────────────────────

export interface DashboardStats {
    totalCustomers: number;
    activeFilings: number;
    pendingDocuments: number;
    pendingReviews: number;
    revenueThisMonth: number;
    revenuePrevMonth: number;
    openSupportTickets: number;
    completedFilingsYTD: number;
    recentActivity: ActivityItem[];
    monthlyRevenue: MonthlyRevenue[];
}

export interface ActivityItem {
    id: string;
    type: string;
    description: string;
    user?: string;
    createdAt: string;
}

export interface MonthlyRevenue {
    month: string;
    amount: number;
    count: number;
}

// ── Customer management ────────────────────────────────────────────────────

export interface CustomerListItem {
    id: string;
    email: string;
    role: AuthUser['role'];
    createdAt: string;
    profile?: {
        fullName: string;
        phone?: string | null;
        nid?: string | null;
        profilePic?: string | null;
        onboardingDone: boolean;
    } | null;
    _count: {
        filings: number;
        documents: number;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

/** Minimal filing shape returned in admin list views */
export interface FilingListItem {
    id: string;
    assessmentYear: string;
    status: string;
    serviceType: string;
    deadline?: string | null;
    createdAt: string;
    customer?: {
        id: string;
        email: string;
        profile?: { fullName: string } | null;
    } | null;
    advisor?: {
        id: string;
        email: string;
        profile?: { fullName: string } | null;
    } | null;
}

// ── API ────────────────────────────────────────────────────────────────────

export const adminApi = {
    // Dashboard
    getDashboardStats: (): Promise<DashboardStats> =>
        apiClient.get('/analytics/dashboard').then((r) => r.data.data),

    // Customers
    listCustomers: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<PaginatedResponse<CustomerListItem>> =>
        apiClient.get('/admin/customers', { params }).then((r) => r.data.data),

    getCustomer: (id: string): Promise<CustomerListItem> =>
        apiClient.get(`/admin/customers/${id}`).then((r) => r.data.data),

    // Filings — admin view
    listFilings: (params?: {
        page?: number;
        limit?: number;
        status?: string;
        assessmentYear?: string;
        advisorId?: string;
    }): Promise<PaginatedResponse<FilingListItem>> =>
        apiClient.get('/filings', { params }).then((r) => r.data.data),

    updateFilingStatus: (
        id: string,
        status: string,
        note?: string,
    ) => apiClient.patch(`/filings/${id}/status`, { status, note }).then((r) => r.data),

    assignAdvisor: (
        filingId: string,
        advisorId: string,
    ) => apiClient.patch(`/filings/${filingId}/assign`, { advisorId }).then((r) => r.data),

    // Documents — review queue
    listPendingDocuments: (params?: { page?: number; limit?: number }) =>
        apiClient.get('/documents/pending', { params }).then((r) => r.data.data),

    reviewDocument: (
        documentId: string,
        action: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REUPLOAD',
        note?: string,
    ) =>
        apiClient.patch(`/documents/${documentId}/review`, { action, note })
            .then((r) => r.data),

    // Staff
    listStaff: () =>
        apiClient.get('/admin/staff').then((r) => r.data.data),

    inviteStaff: (dto: { email: string; role: string; fullName: string }) =>
        apiClient.post('/admin/staff/invite', dto).then((r) => r.data),

    updateStaffRole: (userId: string, role: string) =>
        apiClient.patch(`/admin/staff/${userId}/role`, { role }).then((r) => r.data),

    deactivateStaff: (userId: string) =>
        apiClient.patch(`/admin/staff/${userId}/deactivate`).then((r) => r.data),
};
