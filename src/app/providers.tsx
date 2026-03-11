'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { initAuthBridge } from '@/lib/api/authBridge';
import { useAuthStore } from '@/lib/store/auth.store';

/**
 * AuthBridgeInit — runs once on mount to wire the Zustand auth store
 * into the Axios interceptors without creating a circular import.
 *
 * This must be a child of Providers (so the QueryClientProvider is already
 * in context) and must render before any API call is made.
 */
function AuthBridgeInit() {
    const { getState } = useAuthStore;

    useEffect(() => {
        initAuthBridge(
            () => getState().accessToken,
            (token) => getState().setAccessToken(token),
            () => getState().logout(),
        );
        // getState is a stable reference on the Zustand store — runs exactly once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: true,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthBridgeInit />
            {children}
            <Toaster
                position="top-right"
                expand={false}
                richColors
                duration={4000}
                toastOptions={{
                    style: { fontFamily: 'var(--font-sans)' },
                }}
            />
        </QueryClientProvider>
    );
}
