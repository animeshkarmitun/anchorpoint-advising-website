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
    user: AuthUser;
}

export const authApi = {
    login: (dto: LoginDto) =>
        apiClient.post<{ data: AuthResponse }>('/auth/login', dto).then((r) => r.data.data),

    register: (dto: RegisterDto) =>
        apiClient.post<{ data: AuthResponse }>('/auth/register', dto).then((r) => r.data.data),

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
