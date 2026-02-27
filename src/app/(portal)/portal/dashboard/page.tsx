'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
    ArrowRight, CheckCircle2, Circle, Clock, AlertCircle,
    FolderOpen, FileText, CalendarDays, MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { filingsApi, type Filing } from '@/lib/api/filings.api';
import { documentsApi } from '@/lib/api/documents.api';
import StatusBadge from '@/components/shared/StatusBadge';
import { SkeletonDashboard } from '@/components/shared/Skeletons';
import {
    cn, formatDate, daysUntil, deadlineColor,
    FILING_STATUS_LABELS, FILING_STEPS, filingStepIndex,
} from '@/lib/utils';

// ── Filing progress stepper ──────────────────────────────────────────────────

function FilingProgressStepper({ filing }: { filing: Filing }) {
    const currentIdx = filingStepIndex(filing.status);

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-[var(--color-neutral-500)] mb-0.5">
                        {filing.assessmentYear} Filing
                    </p>
                    <h2 className="font-semibold text-[var(--color-neutral-900)] text-sm">
                        {filing.serviceType.charAt(0).toUpperCase() + filing.serviceType.slice(1)} Tax Return
                    </h2>
                </div>
                <StatusBadge status={filing.status} size="sm" />
            </div>

            {/* Horizontal scroll stepper */}
            <div className="relative">
                <div className="overflow-x-auto pb-2 -mx-1 px-1">
                    <div className="flex items-start gap-0 min-w-max">
                        {FILING_STEPS.map((step, i) => {
                            const done = i < currentIdx;
                            const current = i === currentIdx;

                            return (
                                <div key={step} className="flex items-start">
                                    {/* Step node */}
                                    <div className="flex flex-col items-center gap-1.5 w-[72px]">
                                        <div
                                            className={cn(
                                                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                                                done ? 'text-white' : '',
                                                current ? 'ring-2 ring-offset-2' : '',
                                            )}
                                            style={{
                                                background: done
                                                    ? 'var(--color-success)'
                                                    : current
                                                        ? 'var(--color-portal-primary)'
                                                        : 'var(--color-neutral-100)',
                                                ringColor: current ? 'var(--color-portal-primary)' : undefined,
                                            }}
                                        >
                                            {done ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : current ? (
                                                <Clock className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                                <Circle className="w-3.5 h-3.5 text-[var(--color-neutral-300)]" />
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                'text-[10px] text-center leading-tight w-16',
                                                current
                                                    ? 'font-semibold text-[var(--color-portal-primary)]'
                                                    : done
                                                        ? 'text-[var(--color-success)]'
                                                        : 'text-[var(--color-neutral-400)]',
                                            )}
                                        >
                                            {FILING_STATUS_LABELS[step]}
                                        </span>
                                    </div>

                                    {/* Connector line */}
                                    {i < FILING_STEPS.length - 1 && (
                                        <div
                                            className="mt-3.5 h-0.5 w-4 flex-shrink-0"
                                            style={{
                                                background: i < currentIdx
                                                    ? 'var(--color-success)'
                                                    : 'var(--color-neutral-200)',
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Fade-out scroll hint on right edge */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-10
                        bg-gradient-to-l from-white to-transparent" />
            </div>

            {filing.deadline && (() => {
                const days = daysUntil(filing.deadline!);
                const overdue = days < 0;
                return (
                    <div className={cn(
                        'mt-4 flex items-center gap-2 text-xs font-medium',
                        overdue ? 'text-[var(--color-danger)]' : deadlineColor(days),
                    )}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {overdue
                            ? `Deadline passed ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`
                            : `Deadline: ${formatDate(filing.deadline!)} (${days} day${days !== 1 ? 's' : ''} left)`
                        }
                    </div>
                );
            })()}

            <Link
                href={`/portal/filings/${filing.id}`}
                className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--color-portal-primary)]
                   hover:underline"
            >
                View full details <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    );
}

// ── Quick action button ──────────────────────────────────────────────────────

function QuickAction({
    icon, label, href, badge,
}: {
    icon: React.ReactNode;
    label: string;
    href: string;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border
                 border-[var(--color-neutral-100)] bg-white active:bg-[var(--color-neutral-50)]
                 hover:border-[var(--color-portal-primary)]/30 hover:shadow-sm
                 transition-all relative min-h-[80px] justify-center"
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1B3A6B]/10"
            >
                {icon}
            </div>
            <span className="text-xs font-medium text-[var(--color-neutral-700)] text-center leading-tight">
                {label}
            </span>
            {badge !== undefined && badge > 0 && (
                <span
                    className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full
                     text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ background: 'var(--color-danger)' }}
                >
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </Link>
    );
}

// ── Checklist summary card ────────────────────────────────────────────────────

function ChecklistSummary({ filingId }: { filingId: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ['checklist', filingId],
        queryFn: () => documentsApi.getChecklist(filingId),
        staleTime: 30_000,
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <div className="skeleton h-4 w-32 rounded mb-3" />
                <div className="skeleton h-2.5 w-full rounded-full mb-2" />
                <div className="space-y-2">
                    {[0, 1, 2].map((i) => <div key={i} className="skeleton h-6 rounded" />)}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { checklist, completionRate } = data;
    const pending = checklist.filter((c) => !c.document || c.document.status !== 'ACCEPTED');

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-[var(--color-neutral-900)]">Document Checklist</h3>
                <span className="text-xs text-[var(--color-neutral-500)]">{completionRate}% done</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-[var(--color-neutral-100)] rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${completionRate}%`,
                        background: completionRate === 100
                            ? 'var(--color-success)'
                            : 'var(--color-portal-primary)',
                    }}
                />
            </div>

            {/* First 4 items */}
            <ul className="space-y-2">
                {checklist.slice(0, 4).map((item) => {
                    const accepted = item.document?.status === 'ACCEPTED';
                    const rejected = ['REJECTED', 'NEEDS_REUPLOAD'].includes(item.document?.status ?? '');

                    return (
                        <li key={item.id} className="flex items-center gap-2.5">
                            <div className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                                accepted ? 'text-[var(--color-success)]' : rejected ? 'bg-red-50' : 'bg-[var(--color-neutral-100)]',
                            )}>
                                {accepted
                                    ? <CheckCircle2 className="w-4 h-4" />
                                    : rejected
                                        ? <AlertCircle className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                                        : <Circle className="w-3.5 h-3.5 text-[var(--color-neutral-300)]" />}
                            </div>
                            <span className={cn(
                                'text-xs flex-1 truncate',
                                accepted ? 'line-through text-[var(--color-neutral-400)]' : 'text-[var(--color-neutral-700)]',
                            )}>
                                {item.label}
                            </span>
                            {item.isRequired && !accepted && (
                                <span className="text-[10px] text-[var(--color-danger)] font-medium flex-shrink-0">Required</span>
                            )}
                        </li>
                    );
                })}
            </ul>

            {pending.length > 0 && (
                <Link
                    href={`/portal/documents?filingId=${filingId}`}
                    className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs
                     font-medium text-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/8
                     hover:bg-[var(--color-portal-primary)]/15 transition-all"
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Upload {pending.length} pending document{pending.length !== 1 ? 's' : ''}
                </Link>
            )}
        </div>
    );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);

    const { data: filings, isLoading, isError, refetch } = useQuery({
        queryKey: ['filings', 'my'],
        queryFn: filingsApi.list,
        staleTime: 60_000,
    });

    const activeFiling = filings?.find(
        (f) => !['COMPLETED', 'ON_HOLD'].includes(f.status),
    ) ?? filings?.[0];

    if (isLoading) return <SkeletonDashboard />;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    return (
        <div className="space-y-5">

            {/* Greeting */}
            <div>
                <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">
                    {greeting}, {firstName} 👋
                </h1>
                <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">
                    Here's your filing overview for today
                </p>
            </div>

            {/* Active Filing Stepper */}
            {activeFiling ? (
                <FilingProgressStepper filing={activeFiling} />
            ) : (
                <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-6 text-center">
                    <p className="text-sm text-[var(--color-neutral-500)] mb-3">No active filing yet</p>
                    <Link
                        href="/portal/payments"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                       text-white transition-all"
                        style={{ background: 'var(--color-portal-primary)' }}
                    >
                        Get Started →
                    </Link>
                </div>
            )}

            {/* Quick actions — 2×2 on mobile, 4-wide on desktop */}
            <div>
                <h2 className="text-sm font-semibold text-[var(--color-neutral-700)] mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <QuickAction
                        icon={<FolderOpen className="w-5 h-5" style={{ color: 'var(--color-portal-primary)' }} />}
                        label="Upload Document"
                        href="/portal/documents"
                    />
                    <QuickAction
                        icon={<FileText className="w-5 h-5" style={{ color: 'var(--color-portal-primary)' }} />}
                        label="View My Filing"
                        href={activeFiling ? `/portal/filings/${activeFiling.id}` : '/portal/filings'}
                    />
                    <QuickAction
                        icon={<CalendarDays className="w-5 h-5" style={{ color: 'var(--color-portal-primary)' }} />}
                        label="Book Consultation"
                        href="/portal/consultations"
                    />
                    <QuickAction
                        icon={<MessageSquare className="w-5 h-5" style={{ color: 'var(--color-portal-primary)' }} />}
                        label="Message Advisor"
                        href="/portal/messages"
                    />
                </div>
            </div>

            {/* Checklist + All Filings side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Document checklist */}
                {activeFiling && <ChecklistSummary filingId={activeFiling.id} />}

                {/* All filings list */}
                <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm text-[var(--color-neutral-900)]">All Filings</h3>
                        <Link href="/portal/filings" className="text-xs text-[var(--color-portal-primary)] hover:underline">
                            View all
                        </Link>
                    </div>

                    {isError ? (
                        <p className="text-xs text-[var(--color-neutral-400)] py-4 text-center">
                            Could not load filings.{' '}
                            <button onClick={() => refetch()} className="underline">Retry</button>
                        </p>
                    ) : !filings?.length ? (
                        <p className="text-xs text-[var(--color-neutral-400)] py-6 text-center">
                            No filings yet.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {filings.map((f) => (
                                <li key={f.id}>
                                    <Link
                                        href={`/portal/filings/${f.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg
                               hover:bg-[var(--color-neutral-50)] transition-all group"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-neutral-900)] group-hover:text-[var(--color-portal-primary)] transition-colors">
                                                {f.assessmentYear}
                                            </p>
                                            <p className="text-xs text-[var(--color-neutral-500)] capitalize">{f.serviceType}</p>
                                        </div>
                                        <StatusBadge status={f.status} size="sm" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
