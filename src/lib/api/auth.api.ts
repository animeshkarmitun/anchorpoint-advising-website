import apiClient from './client';
import type { AuthUser } from '@/lib/store/auth.store';

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any; // Raw backend shape — mapUser normalises to AuthUser
}

/** Map backend user shape to frontend AuthUser */
function mapUser(raw: any): AuthUser {
    return {
        id: raw.id,
        email: raw.email,
        phone: raw.phone ?? null,
        role: raw.role,
        name: raw.profile?.fullName ?? raw.name ?? raw.email,
        onboardingDone: raw.profile?.onboardingDone ?? raw.onboardingDone,
        language: raw.profile?.language ?? raw.language,
    };
}

export const authApi = {
    login: (dto: LoginDto) =>
        apiClient.post<{ data: AuthResponse }>('/auth/login', dto).then((r) => {
            const d = r.data.data;
            return {
                ...d,
                user: mapUser(d.user),
            };
        }),

    register: (dto: RegisterDto) =>
        apiClient.post<{ data: AuthResponse }>('/auth/register', dto).then((r) => {
            const d = r.data.data;
            return {
                ...d,
                user: mapUser(d.user),
            };
        }),

    logout: () =>
        apiClient.post('/auth/logout').then(() => undefined),

    refresh: () =>
        apiClient.post<{ data: { accessToken: string } }>('/auth/refresh').then((r) => r.data.data),

    forgotPassword: (email: string) =>
        apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),

    resetPassword: (token: string, password: string) =>
        apiClient.post('/auth/reset-password', { token, password }).then((r) => r.data),

    changePassword: (currentPassword: string, newPassword: string) =>
        apiClient.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

    me: () =>
        apiClient.get<{ data: AuthUser }>('/auth/me').then((r) => r.data.data),
};
