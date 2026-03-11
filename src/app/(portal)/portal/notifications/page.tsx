'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Trash2, Loader2, Filter } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { notificationsApi, type Notification } from '@/lib/api/notifications.api';
import { useUiStore } from '@/lib/store/ui.store';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

const TYPE_ICONS: Record<string, string> = {
    DOCUMENT:     '📄',
    FILING:       '📋',
    PAYMENT:      '💳',
    CONSULTATION: '📅',
    MESSAGE:      '💬',
    SYSTEM:       '🔔',
};

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const setUnreadNotifications = useUiStore((s) => s.setUnreadNotifications);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', filter, page],
        queryFn: () => notificationsApi.list({
            page,
            limit: 20,
            unreadOnly: filter === 'unread',
        }),
        staleTime: 15_000,
    });

    const notifications: Notification[] = data?.data ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 20);

    const markRead = useMutation({
        mutationFn: (id: string) => notificationsApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: () => notificationsApi.markAllAsRead(),
        onSuccess: () => {
            setUnreadNotifications(0);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
    });

    const deleteNotif = useMutation({
        mutationFn: (id: string) => notificationsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
    });

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Notifications</h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">{total} total</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter */}
                    <div className="flex gap-1 bg-[var(--color-neutral-100)] rounded-lg p-0.5">
                        {(['all', 'unread'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                                    filter === f
                                        ? 'bg-white text-[var(--color-neutral-900)] shadow-sm'
                                        : 'text-[var(--color-neutral-500)]',
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Mark all read */}
                    <button
                        onClick={() => markAllRead.mutate()}
                        disabled={markAllRead.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                   border border-[var(--color-neutral-200)] text-[var(--color-neutral-600)]
                                   hover:bg-[var(--color-neutral-50)] transition-all disabled:opacity-50"
                    >
                        {markAllRead.isPending
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <CheckCheck className="w-3 h-3" />}
                        Mark all read
                    </button>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-2">
                    {[0, 1, 2, 3, 4].map((i) => <SkeletonCard key={i} className="h-16" />)}
                </div>
            ) : notifications.length === 0 ? (
                <EmptyState
                    icon={<Bell className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    description="You'll see updates about your filings, payments, and messages here."
                />
            ) : (
                <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] overflow-hidden divide-y divide-[var(--color-neutral-50)]">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={cn(
                                'flex items-start gap-3 px-4 py-3 transition-all',
                                !n.isRead && 'bg-blue-50/30',
                            )}
                        >
                            <span className="text-lg flex-shrink-0 mt-0.5">
                                {TYPE_ICONS[n.type] ?? '🔔'}
                            </span>
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => {
                                    if (!n.isRead) markRead.mutate(n.id);
                                    if (n.link) window.location.href = n.link;
                                }}
                            >
                                <p className={cn(
                                    'text-sm leading-relaxed',
                                    !n.isRead
                                        ? 'font-semibold text-[var(--color-neutral-900)]'
                                        : 'text-[var(--color-neutral-700)]',
                                )}>
                                    {n.title}
                                </p>
                                <p className="text-xs text-[var(--color-neutral-500)] mt-0.5 line-clamp-2">
                                    {n.message}
                                </p>
                                <p className="text-[10px] text-[var(--color-neutral-400)] mt-1">
                                    {timeAgo(n.createdAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                {!n.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                )}
                                <button
                                    onClick={() => deleteNotif.mutate(n.id)}
                                    className="p-1 rounded-lg text-[var(--color-neutral-400)]
                                               hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-600)] disabled:opacity-40 transition-all"
                    >
                        Previous
                    </button>
                    <span className="text-xs text-[var(--color-neutral-500)]">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-600)] disabled:opacity-40 transition-all"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
