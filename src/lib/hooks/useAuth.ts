'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi, type LoginDto, type RegisterDto } from '@/lib/api/auth.api';
import { useAuthStore } from '@/lib/store/auth.store';
import { getApiError } from '@/lib/utils';

// ── Current user ──────────────────────────────────────────────────────────

export function useCurrentUser() {
    const user = useAuthStore((s) => s.user);
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: authApi.me,
        enabled: !!user,           // only fetch if we have a stored user
        staleTime: 5 * 60 * 1000,  // 5 min — profile doesn't change frequently
    });
}

// ── Login ─────────────────────────────────────────────────────────────────

export function useLogin() {
    const { setAuth } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: LoginDto) => authApi.login(dto),
        onSuccess: (data) => {
            setAuth(data.accessToken, data.user);
            queryClient.setQueryData(['auth', 'me'], data.user);

            toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);

            if (data.user.role === 'CUSTOMER') {
                // If onboarding not done, go there first
                const next = new URLSearchParams(window.location.search).get('next');
                router.push(
                    data.user.onboardingDone === false
                        ? '/portal/onboarding'
                        : next || '/portal/dashboard',
                );
            } else {
                router.push('/admin/dashboard');
            }
        },
        onError: (err) => {
            toast.error(getApiError(err));
        },
    });
}

// ── Register ──────────────────────────────────────────────────────────────

export function useRegister() {
    const { setAuth } = useAuthStore();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: RegisterDto) => authApi.register(dto),
        onSuccess: (data) => {
            setAuth(data.accessToken, data.user);
            queryClient.setQueryData(['auth', 'me'], data.user);
        },
        onError: (err) => {
            toast.error(getApiError(err));
        },
    });
}

// ── Logout ────────────────────────────────────────────────────────────────

export function useLogout() {
    const logout = useAuthStore((s) => s.logout);
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => authApi.logout(),
        onSettled: () => {
            logout();
            queryClient.clear();
            // Redirect to the appropriate login page based on which portal was in use
            const isAdminRoute =
                typeof window !== 'undefined' &&
                window.location.pathname.startsWith('/admin');
            router.push(isAdminRoute ? '/admin/login' : '/portal/login');
        },
    });
}

// ── Forgot / Reset password ───────────────────────────────────────────────

export function useForgotPassword() {
    return useMutation({
        mutationFn: (email: string) => authApi.forgotPassword(email),
        onSuccess: () => {
            toast.success('If that email exists, a reset link has been sent.');
        },
        onError: (err) => toast.error(getApiError(err)),
    });
}

export function useResetPassword() {
    const router = useRouter();
    return useMutation({
        mutationFn: ({ token, password }: { token: string; password: string }) =>
            authApi.resetPassword(token, password),
        onSuccess: () => {
            toast.success('Password updated. Please login.');
            router.push('/portal/login');
        },
        onError: (err) => toast.error(getApiError(err)),
    });
}
