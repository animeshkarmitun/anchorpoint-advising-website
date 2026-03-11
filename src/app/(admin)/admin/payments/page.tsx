'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DollarSign, TrendingUp, CreditCard, AlertTriangle,
    Loader2, Receipt,
    CheckCircle2, XCircle,
} from 'lucide-react';
import { cn, formatBDT, formatDate, getApiError } from '@/lib/utils';
import {
    adminPaymentsApi,
    type Payment, type PaymentStats, type RefundRequest,
} from '@/lib/api/payments.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard, SkeletonTable } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
    icon: React.ElementType; label: string; value: string | number; color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
                <p className="text-lg font-bold text-[var(--color-neutral-900)]">{value}</p>
                <p className="text-xs text-[var(--color-neutral-500)]">{label}</p>
            </div>
        </div>
    );
}

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
    { key: 'overview',  label: 'Overview' },
    { key: 'payments',  label: 'All Payments' },
    { key: 'refunds',   label: 'Refund Queue' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Payments table ────────────────────────────────────────────────────────────

function PaymentsTab() {
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'payments', statusFilter, page],
        queryFn: () => adminPaymentsApi.list({
            page, limit: 20,
            status: statusFilter ? statusFilter as Payment['status'] : undefined,
        }),
        staleTime: 30_000,
    });

    const payments = data?.data ?? [];

    if (isLoading) return <SkeletonTable rows={8} cols={6} />;
    if (isError) return <EmptyState title="Couldn't load payments" action={{ label: 'Retry', onClick: () => refetch() }} />;

    return (
        <div className="space-y-4">
            <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                           text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[140px]"
            >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
            </select>

            {payments.length === 0 ? (
                <EmptyState
                    icon={<Receipt className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title="No payments"
                    description="Payments will appear here."
                />
            ) : (
                <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Customer</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Amount</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden sm:table-cell">Method</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden md:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p: Payment & { user?: { id: string; email: string; profile?: { fullName: string } | null } }) => (
                                    <tr key={p.id} className="border-b border-[var(--color-neutral-50)] last:border-0 hover:bg-[var(--color-neutral-50)]/50">
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm font-medium text-[var(--color-neutral-900)]">
                                                {p.user?.profile?.fullName ?? p.user?.email ?? '—'}
                                            </p>
                                            <p className="text-xs text-[var(--color-neutral-500)]">
                                                {p.filing
                                                    ? `${p.filing.serviceType} (${p.filing.assessmentYear})`
                                                    : p.consultation ? 'Consultation' : '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-semibold text-[var(--color-neutral-900)]">{formatBDT(p.amount)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <span className="text-xs text-[var(--color-neutral-600)]">{p.method}</span>
                                        </td>
                                        <td className="px-4 py-3.5"><StatusBadge status={p.status} size="sm" /></td>
                                        <td className="px-4 py-3.5 hidden md:table-cell">
                                            <span className="text-xs text-[var(--color-neutral-500)]">{formatDate(p.createdAt)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Refund queue ──────────────────────────────────────────────────────────────

function RefundsTab() {
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Reset reason when switching to a different refund
    useEffect(() => {
        if (processingId) setRejectReason('');
    }, [processingId]);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'refund-queue'],
        queryFn: () => adminPaymentsApi.getRefundQueue(),
        staleTime: 15_000,
    });

    const approve = useMutation({
        mutationFn: (refundId: string) => adminPaymentsApi.processRefund(refundId, { status: 'approved' }),
        onSuccess: () => {
            toast.success('Refund approved');
            queryClient.invalidateQueries({ queryKey: ['admin', 'refund-queue'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'payment-stats'] });
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const reject = useMutation({
        mutationFn: (refundId: string) =>
            adminPaymentsApi.processRefund(refundId, { status: 'rejected', reason: rejectReason }),
        onSuccess: () => {
            toast.success('Refund rejected');
            queryClient.invalidateQueries({ queryKey: ['admin', 'refund-queue'] });
            setProcessingId(null);
            setRejectReason('');
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const refunds: RefundRequest[] = Array.isArray(data) ? data : [];

    if (isLoading) return <SkeletonTable rows={4} cols={4} />;
    if (isError) return <EmptyState title="Couldn't load refunds" action={{ label: 'Retry', onClick: () => refetch() }} />;

    if (refunds.length === 0) {
        return (
            <EmptyState
                icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
                title="No pending refunds"
                description="All refund requests have been processed."
            />
        );
    }

    return (
        <>
            <div className="space-y-3">
                {refunds.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
                                    {r.user?.profile?.fullName ?? r.user?.email ?? 'Unknown'}
                                </p>
                                <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                                    {formatDate(r.createdAt)} · {formatBDT(r.amount)}
                                </p>
                            </div>
                            <StatusBadge status={r.status} size="sm" />
                        </div>

                        <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 mb-3">
                            <p className="text-[10px] text-[var(--color-neutral-400)] uppercase font-semibold mb-1">Reason</p>
                            <p className="text-xs text-[var(--color-neutral-700)] leading-relaxed">{r.reason}</p>
                        </div>

                        {r.status === 'PENDING' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => approve.mutate(r.id)}
                                    disabled={approve.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                               text-white bg-[var(--color-success)] hover:bg-green-700 transition-all"
                                >
                                    {approve.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => setProcessingId(r.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                               border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                                >
                                    <XCircle className="w-3 h-3" /> Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Reject dialog */}
            {processingId && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setProcessingId(null)} />
                    <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                                   w-[90vw] max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 animate-scale-in">
                        <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">Reject Refund</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejecting..."
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                       text-sm placeholder:text-[var(--color-neutral-400)]
                                       focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setProcessingId(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                                           text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={() => reject.mutate(processingId)}
                                disabled={!rejectReason.trim() || reject.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                                           text-white bg-[var(--color-danger)] hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {reject.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Reject Refund
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
    const [tab, setTab] = useState<TabKey>('overview');

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin', 'payment-stats'],
        queryFn: () => adminPaymentsApi.getStats(),
        staleTime: 60_000,
    });

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Payments</h1>
                <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">Revenue overview, payments, and refund processing</p>
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

            {/* Tab content */}
            {tab === 'overview' && (
                <div className="space-y-5">
                    {statsLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} className="h-24" />)}
                        </div>
                    ) : stats ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard icon={DollarSign}     label="Total Revenue"    value={formatBDT(stats.totalRevenue)}      color="#16A34A" />
                            <StatCard icon={TrendingUp}     label="This Month"       value={formatBDT(stats.monthlyRevenue)}    color="#4F46E5" />
                            <StatCard icon={CreditCard}     label="Pending"          value={stats.pendingPayments}              color="#D97706" />
                            <StatCard icon={AlertTriangle}  label="Refunds Pending"  value={stats.refundsPending}               color="#DC2626" />
                        </div>
                    ) : null}

                    {/* Quick payments table */}
                    <PaymentsTab />
                </div>
            )}

            {tab === 'payments' && <PaymentsTab />}
            {tab === 'refunds' && <RefundsTab />}
        </div>
    );
}
