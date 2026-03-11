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
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

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
    const months = (stats.monthlyRevenue ?? []).slice(-12);

    const chartData = months.map((m) => ({
        month: m.month.slice(5), // MM only
        amount: m.amount,
    }));

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

            {/* Revenue bar chart (Recharts) */}
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-4">Monthly Revenue</h3>
                {chartData.length === 0 ? (
                    <p className="text-sm text-[var(--color-neutral-400)] text-center py-8">No revenue data available</p>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                                tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                                formatter={(value) => [formatBDT(Number(value ?? 0)), 'Revenue']}
                                labelStyle={{ fontWeight: 600, fontSize: 12 }}
                            />
                            <Bar dataKey="amount" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#818CF8" />
                                    <stop offset="100%" stopColor="#4F46E5" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
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
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-3">Customer Growth</h3>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={(stats.monthlyRevenue ?? []).slice(-12).map((m) => ({
                        month: m.month.slice(5),
                        customers: m.count,
                    }))} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
                        <Bar dataKey="customers" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ── Filings tab ───────────────────────────────────────────────────────────────

const FILING_STATUS_COLORS = ['#4F46E5', '#D97706', '#16A34A', '#DC2626', '#0891B2'];

function FilingsTab({ stats }: { stats: DashboardStats }) {
    const donutData = [
        { name: 'Active', value: stats.activeFilings },
        { name: 'Pending Docs', value: stats.pendingDocuments },
        { name: 'Completed', value: stats.completedFilingsYTD },
        { name: 'Under Review', value: stats.pendingReviews },
    ].filter((d) => d.value > 0);

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
                {donutData.length === 0 ? (
                    <p className="text-sm text-[var(--color-neutral-400)] text-center py-8">No filings data available</p>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={100}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {donutData.map((_, i) => (
                                    <Cell key={i} fill={FILING_STATUS_COLORS[i % FILING_STATUS_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0' }} />
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                formatter={(value: string) => <span className="text-xs text-[#374151]">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
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
