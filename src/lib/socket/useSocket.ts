'use client';

import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from './socket.client';
import { useAuthStore } from '@/lib/store/auth.store';
import { useUiStore } from '@/lib/store/ui.store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Hook that manages the socket lifecycle and event listeners.
 * Mount this ONCE in the authenticated shell layout.
 *
 * Events handled:
 * - `message:new`       → invalidate messages query + increment unread
 * - `notification:new`  → increment bell badge + show toast
 * - `user:typing`       → (handled locally in message component)
 */
export function useSocket() {
    const user = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const mounted = useRef(false);

    useEffect(() => {
        if (!user || mounted.current) return;
        mounted.current = true;

        const socket = getSocket();

        // ── Incoming message ──────────────────────────────────────────────
        socket.on('message:new', (data: { conversationId: string; content: string; senderName?: string }) => {
            // Refresh conversation list & thread
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
            useUiStore.getState().incrementUnreadMessages();

            // Desktop toast
            if (data.senderName) {
                toast.info(`New message from ${data.senderName}`, {
                    description: data.content.slice(0, 80),
                    duration: 4000,
                });
            }
        });

        // ── Incoming notification ─────────────────────────────────────────
        socket.on('notification:new', (data: { title: string; message: string; link?: string }) => {
            useUiStore.getState().incrementUnreadNotifications();
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            toast(data.title, {
                description: data.message,
                duration: 5000,
                action: data.link ? {
                    label: 'View',
                    onClick: () => window.location.href = data.link!,
                } : undefined,
            });
        });

        // ── Read receipt ──────────────────────────────────────────────────
        socket.on('message:read', (data: { conversationId: string }) => {
            queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
        });

        return () => {
            disconnectSocket();
            mounted.current = false;
        };
    }, [user, queryClient]);
}
