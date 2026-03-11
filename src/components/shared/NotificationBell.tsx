'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { notificationsApi, type Notification } from '@/lib/api/notifications.api';
import { useUiStore } from '@/lib/store/ui.store';

const ICON_MAP: Record<string, string> = {
    DOCUMENT:      '📄',
    FILING:        '📋',
    PAYMENT:       '💳',
    CONSULTATION:  '📅',
    MESSAGE:       '💬',
    SYSTEM:        '🔔',
};

export default function NotificationBell() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { unreadNotifications, setUnreadNotifications } = useUiStore();

    // Fetch unread count on mount (syncs Zustand with server)
    const { data: countData } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => notificationsApi.getUnreadCount(),
        staleTime: 30_000,
        refetchInterval: 30_000,
    });

    useEffect(() => {
        if (countData?.count !== undefined) {
            setUnreadNotifications(countData.count);
        }
    }, [countData, setUnreadNotifications]);

    // Fetch latest notifications when dropdown is open
    const { data: notifData, isLoading } = useQuery({
        queryKey: ['notifications', 'dropdown'],
        queryFn: () => notificationsApi.list({ limit: 8 }),
        enabled: open,
        staleTime: 15_000,
    });

    const notifications: Notification[] = notifData?.data ?? [];

    // Mark single as read
    const markRead = useMutation({
        mutationFn: (id: string) => notificationsApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read
    const markAllRead = useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => {
            setUnreadNotifications(0);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            {/* Bell button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg
                           text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] transition-all"
                aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
            >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                    <span
                        className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full
                                   text-[9px] font-bold text-white flex items-center justify-center animate-pulse"
                        style={{ background: 'var(--color-danger)' }}
                    >
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[440px]
                                bg-white rounded-xl border border-[var(--color-neutral-100)]
                                shadow-lg overflow-hidden z-50 animate-dropdown-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-neutral-100)]">
                        <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">
                            Notifications
                        </h3>
                        {unreadNotifications > 0 && (
                            <button
                                onClick={() => markAllRead.mutate()}
                                disabled={markAllRead.isPending}
                                className="flex items-center gap-1 text-[10px] font-medium text-indigo-600
                                           hover:text-indigo-800 transition-colors disabled:opacity-50"
                            >
                                {markAllRead.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-3 h-3" />
                                )}
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto max-h-[340px]">
                        {isLoading ? (
                            <div className="p-4 space-y-3">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="animate-pulse flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-100)]" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-[var(--color-neutral-100)] rounded w-3/4" />
                                            <div className="h-2.5 bg-[var(--color-neutral-100)] rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-10 text-center">
                                <Bell className="w-6 h-6 text-[var(--color-neutral-300)] mx-auto mb-2" />
                                <p className="text-xs text-[var(--color-neutral-500)]">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => {
                                        if (!n.isRead) markRead.mutate(n.id);
                                        if (n.link) {
                                            window.location.href = n.link;
                                            setOpen(false);
                                        }
                                    }}
                                    className={cn(
                                        'w-full flex gap-3 px-4 py-3 text-left transition-all hover:bg-[var(--color-neutral-50)]',
                                        !n.isRead && 'bg-blue-50/40',
                                    )}
                                >
                                    <span className="text-lg flex-shrink-0 mt-0.5">
                                        {ICON_MAP[n.type] ?? '🔔'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            'text-xs leading-relaxed',
                                            !n.isRead
                                                ? 'font-semibold text-[var(--color-neutral-900)]'
                                                : 'text-[var(--color-neutral-700)]',
                                        )}>
                                            {n.title}
                                        </p>
                                        <p className="text-[10px] text-[var(--color-neutral-500)] mt-0.5 line-clamp-2">
                                            {n.message}
                                        </p>
                                        <p className="text-[9px] text-[var(--color-neutral-400)] mt-1">
                                            {timeAgo(n.createdAt)}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-[var(--color-neutral-100)] px-4 py-2.5">
                            <a
                                href="/portal/notifications"
                                className="flex items-center justify-center gap-1 text-xs font-medium
                                           text-indigo-600 hover:text-indigo-800 transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                View all notifications
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
