'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    LayoutGrid, List, Search, Filter, ChevronRight,
    User, Calendar, Clock, Loader2, X, AlertCircle,
} from 'lucide-react';
import { cn, formatDate, timeAgo, getApiError, FILING_STATUS_LABELS, FILING_STEPS } from '@/lib/utils';
import { adminApi, type FilingListItem } from '@/lib/api/admin.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonTable, SkeletonCard } from '@/components/shared/Skeletons';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { toast } from 'sonner';

// ── Filing detail slide-in panel ──────────────────────────────────────────────

function FilingPanel({
    filing, onClose,
}: {
    filing: FilingListItem | null;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [newStatus, setNewStatus] = useState('');
    const [note, setNote]           = useState('');

    // Reset state when switching to a different filing
    useEffect(() => {
        setNewStatus('');
        setNote('');
    }, [filing?.id]);

    const statusMut = useMutation({
        mutationFn: () => adminApi.updateFilingStatus(filing!.id, newStatus, note || undefined),
        onSuccess: () => {
            toast.success('Status updated');
            queryClient.invalidateQueries({ queryKey: ['admin', 'filings'] });
            setNewStatus('');
            setNote('');
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    if (!filing) return null;

    const customerName = filing.customer?.profile?.fullName ?? filing.customer?.email ?? 'Unknown';

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
                 onClick={onClose} />

            {/* Panel */}
            <div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-xl border-l border-[var(--color-neutral-100)]
                            overflow-y-auto animate-slide-in-right">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-[var(--color-neutral-100)] p-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">Filing Details</h3>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-neutral-50)] transition-all">
                        <X className="w-4 h-4 text-[var(--color-neutral-500)]" />
                    </button>
                </div>

                <div className="p-4 space-y-5">
                    {/* Summary */}
                    <div className="space-y-3">
                        <dl className="space-y-2">
                            {[
                                { label: 'Customer',       value: customerName },
                                { label: 'Assessment Year', value: filing.assessmentYear },
                                { label: 'Service Type',   value: filing.serviceType },
                                { label: 'Status',         value: null },
                                { label: 'Advisor',        value: filing.advisor?.profile?.fullName ?? 'Unassigned' },
                                { label: 'Created',        value: formatDate(filing.createdAt) },
                                ...(filing.deadline ? [{ label: 'Deadline', value: formatDate(filing.deadline) }] : []),
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between gap-2">
                                    <dt className="text-xs text-[var(--color-neutral-500)]">{label}</dt>
                                    {value ? (
                                        <dd className="text-xs font-medium text-[var(--color-neutral-900)]">{value}</dd>
                                    ) : (
                                        <StatusBadge status={filing.status} size="sm" />
                                    )}
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* Change status */}
                    <div className="bg-[var(--color-neutral-50)] rounded-xl p-4 space-y-3">
                        <h4 className="text-xs font-semibold text-[var(--color-neutral-700)] uppercase tracking-wider">Change Status</h4>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-200)]
                                       text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="">Select new status...</option>
                            {FILING_STEPS.map((s) => (
                                <option key={s} value={s} disabled={s === filing.status}>
                                    {FILING_STATUS_LABELS[s] ?? s}
                                </option>
                            ))}
                            <option value="ON_HOLD">On Hold</option>
                        </select>

                        {newStatus && (
                            <>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Optional note..."
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-neutral-200)]
                                               text-sm resize-none placeholder:text-[var(--color-neutral-400)]
                                               focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                                <button
                                    onClick={() => statusMut.mutate()}
                                    disabled={statusMut.isPending}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                                               text-sm font-semibold text-white transition-all active:scale-[0.97]"
                                    style={{ background: 'var(--color-admin-bg)' }}
                                >
                                    {statusMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Update to {FILING_STATUS_LABELS[newStatus] ?? newStatus}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
    status, filings, onSelect,
}: {
    status: string;
    filings: FilingListItem[];
    onSelect: (f: FilingListItem) => void;
}) {
    const label = FILING_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');

    return (
        <div className="flex flex-col min-w-[280px] max-w-[320px]">
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--color-neutral-50)] rounded-t-xl border border-[var(--color-neutral-100)] border-b-0">
                <StatusBadge status={status} size="sm" showDot={false} />
                <span className="text-xs text-[var(--color-neutral-400)] font-medium">{filings.length}</span>
            </div>

            {/* Cards container */}
            <div className="flex-1 border border-[var(--color-neutral-100)] rounded-b-xl bg-white p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                {filings.length === 0 ? (
                    <p className="text-xs text-[var(--color-neutral-400)] text-center py-6">No filings</p>
                ) : (
                    filings.map((f) => {
                        const name = f.customer?.profile?.fullName ?? f.customer?.email ?? 'Unknown';
                        return (
                            <button
                                key={f.id}
                                onClick={() => onSelect(f)}
                                className="w-full text-left p-3 rounded-lg border border-[var(--color-neutral-100)]
                                           hover:border-indigo-200 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-sm font-medium text-[var(--color-neutral-900)] truncate group-hover:text-indigo-700 transition-colors">
                                        {name}
                                    </p>
                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-neutral-300)] flex-shrink-0" />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                                    <span>{f.assessmentYear}</span>
                                    <span>·</span>
                                    <span className="capitalize">{f.serviceType}</span>
                                </div>
                                {f.advisor && (
                                    <p className="text-[10px] text-[var(--color-neutral-400)] mt-1.5 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {f.advisor.profile?.fullName ?? f.advisor.email}
                                    </p>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── Table view ────────────────────────────────────────────────────────────────

function FilingsTable({
    filings, onSelect,
}: {
    filings: FilingListItem[];
    onSelect: (f: FilingListItem) => void;
}) {
    return (
        <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                            <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Customer</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden sm:table-cell">Year</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden md:table-cell">Advisor</th>
                            <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden lg:table-cell">Created</th>
                            <th className="px-4 py-3 w-10" />
                        </tr>
                    </thead>
                    <tbody>
                        {filings.map((f) => {
                            const name = f.customer?.profile?.fullName ?? f.customer?.email ?? '—';
                            return (
                                <tr
                                    key={f.id}
                                    onClick={() => onSelect(f)}
                                    className="border-b border-[var(--color-neutral-50)] last:border-0
                                               cursor-pointer hover:bg-indigo-50/40 transition-colors group"
                                >
                                    <td className="px-4 py-3.5">
                                        <p className="text-sm font-medium text-[var(--color-neutral-900)] truncate group-hover:text-indigo-700">{name}</p>
                                        <p className="text-xs text-[var(--color-neutral-500)] capitalize">{f.serviceType}</p>
                                    </td>
                                    <td className="px-4 py-3.5 text-sm text-[var(--color-neutral-700)] hidden sm:table-cell">{f.assessmentYear}</td>
                                    <td className="px-4 py-3.5"><StatusBadge status={f.status} size="sm" /></td>
                                    <td className="px-4 py-3.5 hidden md:table-cell">
                                        <span className="text-xs text-[var(--color-neutral-600)]">
                                            {f.advisor?.profile?.fullName ?? 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 hidden lg:table-cell">
                                        <span className="text-xs text-[var(--color-neutral-500)]">{formatDate(f.createdAt)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        <ChevronRight className="w-4 h-4 text-[var(--color-neutral-300)] inline-block" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FilingsPage() {
    const [view, setView]         = useState<'kanban' | 'table'>('kanban');
    const [search, setSearch]     = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedFiling, setSelectedFiling] = useState<FilingListItem | null>(null);

    const debouncedSearch = useDebouncedValue(search, 300);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'filings', statusFilter],
        queryFn:  () => adminApi.listFilings({
            limit: 200,
            status: statusFilter || undefined,
        }),
        staleTime: 30_000,
    });

    const allFilings: FilingListItem[] = Array.isArray(data) ? data : (data as { data?: FilingListItem[] })?.data ?? [];

    // Client-side search filter
    const filteredFilings = useMemo(() => {
        if (!debouncedSearch) return allFilings;
        const q = debouncedSearch.toLowerCase();
        return allFilings.filter((f) =>
            f.customer?.profile?.fullName?.toLowerCase().includes(q) ||
            f.customer?.email?.toLowerCase().includes(q) ||
            f.assessmentYear.includes(q) ||
            f.serviceType.toLowerCase().includes(q)
        );
    }, [allFilings, debouncedSearch]);

    // Group by status for kanban
    const groupedByStatus = useMemo(() => {
        const groups: Record<string, FilingListItem[]> = {};
        for (const step of FILING_STEPS) {
            groups[step] = [];
        }
        groups['ON_HOLD'] = [];
        for (const f of filteredFilings) {
            if (groups[f.status]) {
                groups[f.status].push(f);
            } else {
                groups[f.status] = [f];
            }
        }
        return groups;
    }, [filteredFilings]);

    // Filter out empty Kanban columns in the middle
    const activeStatuses = useMemo(() => {
        return [...FILING_STEPS, 'ON_HOLD'].filter((s) => (groupedByStatus[s]?.length ?? 0) > 0);
    }, [groupedByStatus]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Filings</h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">{filteredFilings.length} filings</p>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 bg-[var(--color-neutral-100)] rounded-lg p-0.5">
                    <button
                        onClick={() => setView('kanban')}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                            view === 'kanban' ? 'bg-white shadow-sm text-indigo-700' : 'text-[var(--color-neutral-500)]',
                        )}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" /> Board
                    </button>
                    <button
                        onClick={() => setView('table')}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                            view === 'table' ? 'bg-white shadow-sm text-indigo-700' : 'text-[var(--color-neutral-500)]',
                        )}
                    >
                        <List className="w-3.5 h-3.5" /> Table
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search customer, year, type..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                   text-sm placeholder:text-[var(--color-neutral-400)]
                                   focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                               text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[160px]"
                >
                    <option value="">All Statuses</option>
                    {FILING_STEPS.map((s) => (
                        <option key={s} value={s}>{FILING_STATUS_LABELS[s]}</option>
                    ))}
                    <option value="ON_HOLD">On Hold</option>
                </select>
            </div>

            {/* Content */}
            {isLoading ? (
                view === 'kanban' ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {[0, 1, 2, 3].map((i) => (
                            <SkeletonCard key={i} className="min-w-[280px] h-64" />
                        ))}
                    </div>
                ) : (
                    <SkeletonTable rows={8} cols={5} />
                )
            ) : isError ? (
                <EmptyState title="Couldn't load filings" action={{ label: 'Retry', onClick: () => refetch() }} />
            ) : filteredFilings.length === 0 ? (
                <EmptyState
                    icon={<AlertCircle className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title={search ? 'No matching filings' : 'No filings yet'}
                    description={search ? `No filings match "${search}".` : 'Filings will appear here once customers start them.'}
                />
            ) : view === 'kanban' ? (
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
                    {activeStatuses.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            filings={groupedByStatus[status] ?? []}
                            onSelect={setSelectedFiling}
                        />
                    ))}
                </div>
            ) : (
                <FilingsTable filings={filteredFilings} onSelect={setSelectedFiling} />
            )}

            {/* Detail panel */}
            <FilingPanel filing={selectedFiling} onClose={() => setSelectedFiling(null)} />
        </div>
    );
}
