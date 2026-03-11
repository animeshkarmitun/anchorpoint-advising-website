'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Users, FolderKanban, FileStack, TrendingUp,
    TrendingDown, RefreshCw, Clock,
    CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn, formatBDT, formatDateTime } from '@/lib/utils';
import { adminApi, type ActivityItem } from '@/lib/api/admin.api';
import { useAuthStore } from '@/lib/store/auth.store';
import { SkeletonCard } from '@/components/shared/Skeletons';

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
    label, value, sub, icon: Icon, trend, trendLabel, loading,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    loading?: boolean;
}) {
    if (loading) return <SkeletonCard />;

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#312E81]/10">
                    <Icon className="w-5 h-5 text-[var(--color-admin-bg)]" />
                </div>
                {trend && trendLabel && (
                    <div className={cn(
                        'flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1',
                        trend === 'up' ? 'text-green-700 bg-green-50' :
                            trend === 'down' ? 'text-red-700 bg-red-50' :
                                'text-[var(--color-neutral-600)] bg-[var(--color-neutral-100)]',
                    )}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                            trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {trendLabel}
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-[var(--color-neutral-900)] leading-none">{value}</p>
            <p className="text-sm text-[var(--color-neutral-500)] mt-1">{label}</p>
            {sub && <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">{sub}</p>}
        </div>
    );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
    const max = Math.max(...data.map((d) => d.amount), 1);

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <h3 className="font-semibold text-sm text-[var(--color-neutral-900)] mb-4">Revenue — Last 6 months</h3>
            <div className="flex items-end gap-2 h-28">
                {data.slice(-6).map((d, i) => (
                    <div key={`${d.month}-${i}`} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-[var(--color-neutral-400)]">
                            {d.amount > 0 ? `৳${(d.amount / 1000).toFixed(0)}k` : ''}
                        </span>
                        <div
                            className="w-full rounded-t-sm transition-all duration-500"
                            style={{
                                height: `${Math.max((d.amount / max) * 88, 4)}px`,
                                background: 'var(--color-admin-bg)',
                                opacity: 0.15 + 0.85 * (d.amount / max),
                            }}
                        />
                        <span className="text-[10px] text-[var(--color-neutral-400)]">
                            {d.month.slice(0, 3)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Activity feed ─────────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, React.ElementType> = {
    FILING_CREATED: FolderKanban,
    DOCUMENT_REVIEW: FileStack,
    USER_REGISTERED: Users,
    STATUS_CHANGE: RefreshCw,
};

function ActivityFeed({ items }: { items: ActivityItem[] }) {
    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <h3 className="font-semibold text-sm text-[var(--color-neutral-900)] mb-3">Recent Activity</h3>
            {items.length === 0 ? (
                <p className="text-xs text-[var(--color-neutral-400)] py-4 text-center">No recent activity</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((item) => {
                        const Icon = ACTIVITY_ICON[item.type] ?? Clock;
                        return (
                            <li key={item.id} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-[var(--color-neutral-100)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Icon className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[var(--color-neutral-700)] leading-snug">{item.description}</p>
                                    {item.user && (
                                        <p className="text-[10px] text-[var(--color-neutral-400)] mt-0.5">{item.user}</p>
                                    )}
                                </div>
                                <time className="text-[10px] text-[var(--color-neutral-400)] flex-shrink-0 whitespace-nowrap pt-0.5">
                                    {formatDateTime(item.createdAt)}
                                </time>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

// ── Admin dashboard page ───────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const user = useAuthStore((s) => s.user);

    const { data, isLoading, dataUpdatedAt, refetch, isRefetching } = useQuery({
        queryKey: ['admin', 'dashboard'],
        queryFn: adminApi.getDashboardStats,
        staleTime: 30_000,
        refetchInterval: 60_000,   // auto-refresh every 60 s
    });

    const revenueTrend = data?.revenueThisMonth != null && data?.revenuePrevMonth != null
        ? data.revenueThisMonth >= data.revenuePrevMonth ? 'up' as const : 'down' as const
        : 'neutral' as const;

    const revenueDiff = data?.revenueThisMonth != null && data?.revenuePrevMonth != null && data.revenuePrevMonth > 0
        ? Math.abs(((data.revenueThisMonth - data.revenuePrevMonth) / data.revenuePrevMonth) * 100).toFixed(0) + '%'
        : undefined;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">
                        Dashboard
                    </h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">
                        Welcome back, {user?.name?.split(' ')[0]}
                        {user?.role === 'SUPER_ADMIN' && ' ⭐'}
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)]
                     transition-colors"
                >
                    <RefreshCw className={cn('w-3.5 h-3.5', isRefetching && 'animate-spin')} />
                    {dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : 'Refresh'}
                </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Customers"
                    value={data?.totalCustomers ?? '—'}
                    icon={Users}
                    loading={isLoading}
                />
                <KpiCard
                    label="Active Filings"
                    value={data?.activeFilings ?? '—'}
                    icon={FolderKanban}
                    sub={`${data?.completedFilingsYTD ?? 0} completed this year`}
                    loading={isLoading}
                />
                <KpiCard
                    label="Pending Documents"
                    value={data?.pendingDocuments ?? '—'}
                    icon={FileStack}
                    sub={`${data?.pendingReviews ?? 0} awaiting review`}
                    trend={data?.pendingDocuments ?? 0 > 10 ? 'down' : 'neutral'}
                    loading={isLoading}
                />
                <KpiCard
                    label="Revenue This Month"
                    value={data?.revenueThisMonth != null ? formatBDT(data.revenueThisMonth) : '—'}
                    icon={TrendingUp}
                    trend={revenueTrend}
                    trendLabel={revenueDiff ? `${revenueDiff} vs last month` : undefined}
                    loading={isLoading}
                />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Revenue mini chart */}
                {isLoading ? (
                    <div className="skeleton h-48 rounded-xl" />
                ) : data?.monthlyRevenue?.length ? (
                    <RevenueChart data={data.monthlyRevenue} />
                ) : null}

                {/* Support alert */}
                <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                    <h3 className="font-semibold text-sm text-[var(--color-neutral-900)] mb-3">Alerts</h3>
                    <ul className="space-y-2">
                        {[
                            {
                                icon: FileStack,
                                text: `${data?.pendingReviews ?? 0} documents waiting for review`,
                                color: (data?.pendingReviews ?? 0) > 0 ? 'text-amber-600' : 'text-[var(--color-neutral-400)]',
                                bg: (data?.pendingReviews ?? 0) > 0 ? 'bg-amber-50' : 'bg-[var(--color-neutral-50)]',
                            },
                            {
                                icon: AlertCircle,
                                text: `${data?.openSupportTickets ?? 0} open support tickets`,
                                color: (data?.openSupportTickets ?? 0) > 5 ? 'text-red-600' : 'text-[var(--color-neutral-400)]',
                                bg: (data?.openSupportTickets ?? 0) > 5 ? 'bg-red-50' : 'bg-[var(--color-neutral-50)]',
                            },
                            {
                                icon: CheckCircle2,
                                text: `${data?.completedFilingsYTD ?? 0} filings completed this year`,
                                color: 'text-green-700',
                                bg: 'bg-green-50',
                            },
                        ].map(({ icon: Icon, text, color, bg }) => (
                            <li key={text} className={cn('flex items-center gap-3 p-3 rounded-lg', bg)}>
                                <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
                                <span className={cn('text-xs font-medium', color)}>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Activity feed */}
            {isLoading ? (
                <div className="skeleton h-64 rounded-xl" />
            ) : data?.recentActivity?.length ? (
                <ActivityFeed items={data.recentActivity} />
            ) : null}
        </div>
    );
}
