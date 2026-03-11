'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreditCard, RotateCcw, Loader2, Receipt,
} from 'lucide-react';
import { cn, formatBDT, formatDate, getApiError } from '@/lib/utils';
import { paymentsApi, type Payment, type PaymentStatus } from '@/lib/api/payments.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Method badge ──────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
    BKASH: 'bKash',
    NAGAD: 'Nagad',
    ROCKET: 'Rocket',
    BANK_TRANSFER: 'Bank',
    CASH: 'Cash',
    CARD: 'Card',
};

function MethodChip({ method }: { method: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold
                         bg-indigo-50 text-indigo-700">
            <CreditCard className="w-3 h-3" />
            {METHOD_LABELS[method] ?? method}
        </span>
    );
}

// ── Refund modal ──────────────────────────────────────────────────────────────

function RefundModal({
    open, onClose, paymentId,
}: {
    open: boolean; onClose: () => void; paymentId: string | null;
}) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState('');

    // Reset state when modal opens — prevents stale reason from previous refund
    useEffect(() => {
        if (open) setReason('');
    }, [open]);

    const refund = useMutation({
        mutationFn: () => paymentsApi.requestRefund(paymentId!, reason),
        onSuccess: () => {
            toast.success('Refund request submitted');
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            onClose();
            setReason('');
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    if (!open || !paymentId) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                           w-[90vw] max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 animate-scale-in">
                <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">Request Refund</h3>
                <p className="text-sm text-[var(--color-neutral-500)]">
                    Please describe why you'd like a refund. Minimum 20 characters.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain your reason..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                               text-sm placeholder:text-[var(--color-neutral-400)]
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={refund.isPending}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={() => refund.mutate()}
                        disabled={refund.isPending || reason.trim().length < 20}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                                   text-white transition-all active:scale-[0.97] disabled:opacity-50"
                        style={{ background: 'var(--color-portal-primary)' }}
                    >
                        {refund.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Submit Request
                    </button>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [refundTarget, setRefundTarget] = useState<string | null>(null);
    const limit = 20;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['payments', statusFilter, page],
        queryFn: () => paymentsApi.list({
            page, limit,
            status: (statusFilter as PaymentStatus) || undefined,
        }),
        staleTime: 30_000,
    });

    const payments = data?.data ?? [];
    const total = data?.total ?? 0;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Payments</h1>
                <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">View your payment history and request refunds</p>
            </div>

            {/* Filter */}
            <div className="flex gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                               text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[140px]"
                >
                    <option value="">All</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                </select>
            </div>

            {/* Table */}
            {isLoading ? (
                <SkeletonTable rows={6} cols={5} />
            ) : isError ? (
                <EmptyState title="Couldn't load payments" action={{ label: 'Retry', onClick: () => refetch() }} />
            ) : payments.length === 0 ? (
                <EmptyState
                    icon={<Receipt className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title="No payments yet"
                    description="Your payment history will appear here once you make a payment."
                />
            ) : (
                <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Service</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Amount</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden sm:table-cell">Method</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Status</th>
                                    <th className="px-4 py-3 w-16" />
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p.id} className="border-b border-[var(--color-neutral-50)] last:border-0 hover:bg-[var(--color-neutral-50)]/50 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm text-[var(--color-neutral-900)]">{formatDate(p.createdAt)}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <p className="text-sm text-[var(--color-neutral-700)]">
                                                {p.filing
                                                    ? `${p.filing.serviceType} (${p.filing.assessmentYear})`
                                                    : p.consultation
                                                        ? 'Consultation'
                                                        : '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="text-sm font-semibold text-[var(--color-neutral-900)]">
                                                {formatBDT(p.amount)}
                                            </span>
                                            {p.discount && p.discount > 0 && (
                                                <span className="text-[10px] text-green-600 ml-1">-{formatBDT(p.discount)}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 hidden sm:table-cell">
                                            <MethodChip method={p.method} />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <StatusBadge status={p.status} size="sm" />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            {p.status === 'COMPLETED' && !p.refundRequest && (
                                                <button
                                                    onClick={() => setRefundTarget(p.id)}
                                                    title="Request refund"
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center
                                                               text-[var(--color-neutral-400)] hover:text-[var(--color-danger)]
                                                               hover:bg-red-50 transition-all"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {p.refundRequest && (
                                                <span className="text-[10px] text-amber-600 font-medium">
                                                    {p.refundRequest.status === 'PENDING' ? 'Refund pending' : p.refundRequest.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RefundModal
                open={!!refundTarget}
                onClose={() => setRefundTarget(null)}
                paymentId={refundTarget}
            />
        </div>
    );
}
