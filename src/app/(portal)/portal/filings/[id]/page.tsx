'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, CheckCircle2, Clock, Circle,
    AlertCircle, FileText, ChevronRight, ThumbsUp, Loader2,
} from 'lucide-react';
import {
    cn, formatDate, formatDateTime, daysUntil,
    deadlineColor, FILING_STATUS_LABELS, FILING_STEPS, filingStepIndex, getApiError,
} from '@/lib/utils';
import { filingsApi, type Filing, type FilingStatusLog } from '@/lib/api/filings.api';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from 'sonner';

// ── Status timeline ───────────────────────────────────────────────────────────

function StatusTimeline({ history }: { history: FilingStatusLog[] }) {
    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <h3 className="font-semibold text-sm text-[var(--color-neutral-900)] mb-4">Status History</h3>
            <ol className="relative border-l-2 border-[var(--color-neutral-100)] ml-3 space-y-5">
                {history.map((log, i) => (
                    <li key={log.id} className="ml-5 relative">
                        {/* Dot */}
                        <div
                            className={cn(
                                'absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center',
                                i === 0 ? 'ring-2 ring-offset-1 ring-[var(--color-portal-primary)]' : '',
                            )}
                            style={{
                                background: i === 0 ? 'var(--color-portal-primary)' : 'var(--color-neutral-300)',
                            }}
                        >
                            {i === 0 && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
                                    {FILING_STATUS_LABELS[log.to] ?? log.to.replace(/_/g, ' ')}
                                </p>
                                {log.from && (
                                    <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">
                                        ← {FILING_STATUS_LABELS[log.from] ?? log.from.replace(/_/g, ' ')}
                                    </p>
                                )}
                                {log.note && (
                                    <p className="text-xs text-[var(--color-neutral-600)] mt-1 bg-[var(--color-neutral-50)] rounded-lg px-2 py-1">
                                        {log.note}
                                    </p>
                                )}
                            </div>
                            <time className="text-[10px] text-[var(--color-neutral-400)] whitespace-nowrap flex-shrink-0 pt-0.5">
                                {formatDateTime(log.createdAt)}
                            </time>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// ── Filing summary card ───────────────────────────────────────────────────────

function FilingSummaryCard({ filing }: { filing: Filing }) {
    const rows = [
        { label: 'Assessment Year', value: filing.assessmentYear },
        { label: 'Service Type', value: filing.serviceType.charAt(0).toUpperCase() + filing.serviceType.slice(1) },
        { label: 'Advisor', value: filing.advisor?.profile?.fullName ?? 'Not yet assigned' },
        ...(filing.totalIncome != null
            ? [{ label: 'Total Income', value: `৳${filing.totalIncome.toLocaleString()}` }]
            : []),
        ...(filing.taxPayable != null
            ? [{ label: 'Tax Payable', value: `৳${filing.taxPayable.toLocaleString()}` }]
            : []),
        ...(filing.taxPaid != null
            ? [{ label: 'Tax Paid', value: `৳${filing.taxPaid.toLocaleString()}` }]
            : []),
        ...(filing.refundAmount != null && filing.refundAmount > 0
            ? [{ label: 'Refund', value: `৳${filing.refundAmount.toLocaleString()}` }]
            : []),
        ...(filing.filedAt
            ? [{ label: 'Filed At', value: formatDate(filing.filedAt) }]
            : []),
    ];

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <h3 className="font-semibold text-sm text-[var(--color-neutral-900)] mb-3">Filing Details</h3>
            <dl className="space-y-2">
                {rows.map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-2">
                        <dt className="text-xs text-[var(--color-neutral-500)] flex-shrink-0">{label}</dt>
                        <dd className="text-xs font-medium text-[var(--color-neutral-900)] text-right">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

// ── Approve button ────────────────────────────────────────────────────────────

function ApproveButton({ filingId }: { filingId: string }) {
    const queryClient = useQueryClient();
    const [confirming, setConfirming] = useState(false);

    const approve = useMutation({
        mutationFn: () => filingsApi.approve(filingId),
        onSuccess: () => {
            toast.success('Your return has been approved. We\'ll now submit to NBR.');
            queryClient.invalidateQueries({ queryKey: ['filing', filingId] });
            queryClient.invalidateQueries({ queryKey: ['filings', 'my'] });
            setConfirming(false);
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    if (!confirming) {
        return (
            <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white
                   w-full justify-center transition-all active:scale-[0.98]"
                style={{ background: 'var(--color-success)' }}
            >
                <ThumbsUp className="w-4 h-4" />
                Approve My Tax Return
            </button>
        );
    }

    return (
        <div className="rounded-xl border-2 border-[var(--color-success)] bg-green-50 p-4 space-y-3">
            <p className="text-sm text-green-800 font-medium">
                Please confirm you have reviewed your tax return and approve it for electronic filing with NBR.
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => approve.mutate()}
                    disabled={approve.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm
                     font-semibold text-white transition-all active:scale-[0.97]"
                    style={{ background: 'var(--color-success)' }}
                >
                    {approve.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Yes, I Approve
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                     text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ── Progress stepper ──────────────────────────────────────────────────────────

function FullStepper({ status }: { status: string }) {
    const currentIdx = filingStepIndex(status);

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <h3 className="font-semibold text-sm text-[var(--color-neutral-900)] mb-4">Progress</h3>
            <div className="space-y-2">
                {FILING_STEPS.map((step, i) => {
                    const done = i < currentIdx;
                    const current = i === currentIdx;

                    return (
                        <div
                            key={step}
                            className={cn(
                                'flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                                current ? 'bg-[var(--color-portal-primary)]/6' : '',
                            )}
                        >
                            <div
                                className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                                    done ? 'text-white' : '',
                                )}
                                style={{
                                    background: done
                                        ? 'var(--color-success)'
                                        : current
                                            ? 'var(--color-portal-primary)'
                                            : 'var(--color-neutral-100)',
                                }}
                            >
                                {done ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : current ? (
                                    <Clock className="w-3 h-3 text-white" />
                                ) : (
                                    <Circle className="w-3 h-3 text-[var(--color-neutral-300)]" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-sm flex-1',
                                    current ? 'font-semibold text-[var(--color-portal-primary)]'
                                        : done ? 'text-[var(--color-success)]'
                                            : 'text-[var(--color-neutral-400)]',
                                )}
                            >
                                {FILING_STATUS_LABELS[step] ?? step}
                            </span>
                            {current && (
                                <span className="text-[10px] font-semibold text-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/10 px-2 py-0.5 rounded-full">
                                    Now
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FilingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const { data: filing, isLoading: filingLoading, isError: filingError } = useQuery({
        queryKey: ['filing', id],
        queryFn: () => filingsApi.get(id),
        staleTime: 30_000,
    });

    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ['filing-history', id],
        queryFn: () => filingsApi.getHistory(id),
        staleTime: 30_000,
    });

    if (filingLoading) {
        return (
            <div className="space-y-4 max-w-2xl">
                <div className="skeleton h-8 w-32 rounded" />
                <div className="skeleton h-48 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="skeleton h-64 rounded-xl" />
                    <div className="skeleton h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    if (filingError || !filing) {
        return (
            <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-[var(--color-danger)] mx-auto mb-3" />
                <p className="text-sm text-[var(--color-neutral-700)]">Filing not found or access denied.</p>
                <button onClick={() => router.back()} className="mt-4 text-sm text-[var(--color-portal-primary)] hover:underline">
                    ← Go back
                </button>
            </div>
        );
    }

    const canApprove = filing.status === 'REVIEW_READY';
    const days = filing.deadline ? daysUntil(filing.deadline) : null;

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Back + header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-neutral-200)]
                     hover:bg-[var(--color-neutral-50)] transition-all"
                >
                    <ArrowLeft className="w-4 h-4 text-[var(--color-neutral-600)]" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-[var(--color-neutral-900)] truncate">
                        {filing.assessmentYear} Tax Return
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={filing.status} size="sm" />
                        {days !== null && (
                            <span className={cn('text-xs font-medium', deadlineColor(days))}>
                                · {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Approve CTA — only when REVIEW_READY */}
            {canApprove && (
                <div className="p-1">
                    <ApproveButton filingId={id} />
                </div>
            )}

            {/* Two-column grid on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left col */}
                <div className="space-y-4">
                    <FullStepper status={filing.status} />
                    <FilingSummaryCard filing={filing} />
                </div>

                {/* Right col */}
                <div className="space-y-4">
                    {/* Documents shortcut */}
                    <Link
                        href={`/portal/documents?filingId=${id}`}
                        className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[var(--color-neutral-100)]
                       hover:border-[var(--color-portal-primary)]/30 hover:shadow-sm transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1B3A6B]/10 flex-shrink-0">
                            <FileText className="w-5 h-5" style={{ color: 'var(--color-portal-primary)' }} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-[var(--color-neutral-900)] group-hover:text-[var(--color-portal-primary)] transition-colors">
                                View Documents
                            </p>
                            <p className="text-xs text-[var(--color-neutral-400)]">Upload or review your checklist</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--color-neutral-400)]" />
                    </Link>

                    {/* Timeline */}
                    {historyLoading ? (
                        <div className="skeleton h-48 rounded-xl" />
                    ) : (
                        history && history.length > 0 && <StatusTimeline history={history} />
                    )}
                </div>
            </div>
        </div>
    );
}
