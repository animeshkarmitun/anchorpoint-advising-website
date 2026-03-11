import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
    id: string;
    email: string;
    phone?: string | null;
    role: 'CUSTOMER' | 'TAX_ADVISOR' | 'ADMIN' | 'SUPPORT' | 'SUPER_ADMIN';
    name: string;
    onboardingDone?: boolean;
    language?: string;
}

interface AuthState {
    /** Access token lives in memory only — never persisted to disk */
    accessToken: string | null;
    /** User profile is persisted (survives page refresh) */
    user: AuthUser | null;

    setAccessToken: (token: string) => void;
    setUser: (user: AuthUser) => void;
    setAuth: (token: string, user: AuthUser) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    /** True only for ADMIN and SUPER_ADMIN — elevated access */
    isAdmin: () => boolean;
    /** True for any non-customer (TAX_ADVISOR, SUPPORT, ADMIN, SUPER_ADMIN) */
    isStaff: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            accessToken: null,
            user: null,

            setAccessToken: (accessToken) => set({ accessToken }),
            setUser: (user) => set({ user }),
            setAuth: (accessToken, user) => set({ accessToken, user }),

            logout: () => set({ accessToken: null, user: null }),

            isAuthenticated: () => !!get().accessToken,

            isAdmin: () =>
                ['ADMIN', 'SUPER_ADMIN'].includes(get().user?.role ?? ''),

            isStaff: () =>
                !!get().user && get().user?.role !== 'CUSTOMER',
        }),
        {
            name: 'apa-auth',
            // Only persist user metadata — NOT the access token (security)
            partialize: (state) => ({ user: state.user }),
        },
    ),
);
