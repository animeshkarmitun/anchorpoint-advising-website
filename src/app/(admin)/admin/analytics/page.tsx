'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    DollarSign, Users, FileStack, TrendingUp,
    Download, CalendarDays, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn, formatBDT } from '@/lib/utils';
import { adminApi, type DashboardStats } from '@/lib/api/admin.api';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, change, color }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    change?: number;
    color: string;
}) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                </div>
                {change !== undefined && (
                    <span className={cn(
                        'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                    )}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </span>
                )}
            </div>
            <p className="text-lg font-bold text-[var(--color-neutral-900)]">{value}</p>
            <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">{label}</p>
        </div>
    );
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'customers', label: 'Customers' },
    { key: 'filings', label: 'Filings' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Revenue tab ───────────────────────────────────────────────────────────────

function RevenueTab({ stats }: { stats: DashboardStats }) {
    const months = stats.monthlyRevenue ?? [];
    const maxAmount = Math.max(...months.map((m) => m.amount), 1);

    return (
        <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <KpiCard icon={DollarSign} label="Total Revenue" value={formatBDT(stats.revenueThisMonth)} color="#16A34A" />
                <KpiCard
                    icon={TrendingUp}
                    label="vs Last Month"
                    value={formatBDT(stats.revenuePrevMonth)}
                    change={stats.revenuePrevMonth > 0
                        ? Math.round(((stats.revenueThisMonth - stats.revenuePrevMonth) / stats.revenuePrevMonth) * 100)
                        : 0}
                    color="#4F46E5"
                />
                <KpiCard icon={FileStack} label="Completed Filings YTD" value={stats.completedFilingsYTD} color="#059669" />
            </div>

            {/* Revenue bar chart (pure CSS) */}
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-4">Monthly Revenue</h3>
                {months.length === 0 ? (
                    <p className="text-sm text-[var(--color-neutral-400)] text-center py-8">No revenue data available</p>
                ) : (
                    <div className="flex items-end gap-2 h-[200px]">
                        {months.slice(-12).map((m, i) => {
                            const pct = (m.amount / maxAmount) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] text-[var(--color-neutral-500)] font-medium">
                                        {formatBDT(m.amount)}
                                    </span>
                                    <div
                                        className="w-full rounded-t-md transition-all duration-500"
                                        style={{
                                            height: `${Math.max(pct, 4)}%`,
                                            background: 'linear-gradient(to top, #4F46E5, #818CF8)',
                                        }}
                                    />
                                    <span className="text-[9px] text-[var(--color-neutral-400)]">
                                        {m.month.slice(5)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Customers tab ─────────────────────────────────────────────────────────────

function CustomersTab({ stats }: { stats: DashboardStats }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard icon={Users} label="Total Customers" value={stats.totalCustomers} color="#4F46E5" />
                <KpiCard icon={FileStack} label="Active Filings" value={stats.activeFilings} color="#D97706" />
                <KpiCard icon={CalendarDays} label="Pending Reviews" value={stats.pendingReviews} color="#DC2626" />
                <KpiCard icon={TrendingUp} label="Completed YTD" value={stats.completedFilingsYTD} color="#16A34A" />
            </div>

            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-3">Customer Distribution</h3>
                <p className="text-sm text-[var(--color-neutral-400)] text-center py-8">
                    Advanced customer analytics charts will be available in Phase 2 with Recharts integration.
                </p>
            </div>
        </div>
    );
}

// ── Filings tab ───────────────────────────────────────────────────────────────

function FilingsTab({ stats }: { stats: DashboardStats }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard icon={FileStack} label="Active Filings" value={stats.activeFilings} color="#4F46E5" />
                <KpiCard icon={TrendingUp} label="Completed YTD" value={stats.completedFilingsYTD} color="#16A34A" />
                <KpiCard icon={CalendarDays} label="Pending Docs" value={stats.pendingDocuments} color="#D97706" />
                <KpiCard icon={Users} label="Open Support" value={stats.openSupportTickets} color="#DC2626" />
            </div>

            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-3">Filing Status Breakdown</h3>
                <p className="text-sm text-[var(--color-neutral-400)] text-center py-8">
                    Filing status donut chart will be available in Phase 2 with Recharts integration.
                </p>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [tab, setTab] = useState<TabKey>('overview');

    const { data: stats, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'dashboard-stats'],
        queryFn: () => adminApi.getDashboardStats(),
        staleTime: 60_000,
    });

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Analytics</h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">Business intelligence and performance metrics</p>
                </div>
                <button
                    onClick={() => toast.info('CSV export coming in Phase 2')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                               border border-[var(--color-neutral-200)] text-[var(--color-neutral-600)]
                               hover:bg-[var(--color-neutral-50)] transition-all"
                >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--color-neutral-100)]">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                            tab === t.key
                                ? 'border-indigo-600 text-indigo-700'
                                : 'border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} className="h-24" />)}
                    </div>
                    <SkeletonCard className="h-[250px]" />
                </div>
            ) : isError || !stats ? (
                <EmptyState title="Failed to load analytics" action={{ label: 'Retry', onClick: () => refetch() }} />
            ) : (
                <>
                    {tab === 'overview' && (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <KpiCard icon={DollarSign} label="Revenue (This Month)" value={formatBDT(stats.revenueThisMonth)} color="#16A34A" />
                                <KpiCard icon={Users} label="Total Customers" value={stats.totalCustomers} color="#4F46E5" />
                                <KpiCard icon={FileStack} label="Active Filings" value={stats.activeFilings} color="#D97706" />
                                <KpiCard icon={TrendingUp} label="Completed YTD" value={stats.completedFilingsYTD} color="#059669" />
                            </div>
                            <RevenueTab stats={stats} />
                        </div>
                    )}
                    {tab === 'revenue' && <RevenueTab stats={stats} />}
                    {tab === 'customers' && <CustomersTab stats={stats} />}
                    {tab === 'filings' && <FilingsTab stats={stats} />}
                </>
            )}
        </div>
    );
}
