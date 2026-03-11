'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search, Users, Filter, ChevronLeft, ChevronRight,
    Download, Mail, Phone, FileText, FolderKanban,
} from 'lucide-react';
import { cn, formatDate, maskSensitive, timeAgo } from '@/lib/utils';
import { adminApi, type CustomerListItem } from '@/lib/api/admin.api';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/Skeletons';

// ── Filters bar ───────────────────────────────────────────────────────────────

function CustomerFilters({
    search, onSearch,
    status, onStatus,
}: {
    search: string; onSearch: (v: string) => void;
    status: string; onStatus: (v: string) => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)]" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search by name, email, phone, or NID..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                               text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]
                               focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400
                               transition-all"
                />
            </div>

            {/* Status filter */}
            <select
                value={status}
                onChange={(e) => onStatus(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                           text-sm text-[var(--color-neutral-700)] bg-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-[140px]"
            >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
            </select>
        </div>
    );
}

// ── Customer row ──────────────────────────────────────────────────────────────

function CustomerRow({ customer, onClick }: { customer: CustomerListItem; onClick: () => void }) {
    const name = customer.profile?.fullName ?? customer.email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();

    return (
        <tr
            onClick={onClick}
            className="group cursor-pointer hover:bg-indigo-50/40 transition-colors border-b border-[var(--color-neutral-50)] last:border-0"
        >
            {/* Customer */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 uppercase"
                         style={{ background: 'var(--color-admin-bg)' }}>
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--color-neutral-900)] truncate group-hover:text-indigo-700 transition-colors">
                            {name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Mail className="w-3 h-3 text-[var(--color-neutral-400)] flex-shrink-0" />
                            <span className="text-xs text-[var(--color-neutral-500)] truncate">{customer.email}</span>
                        </div>
                    </div>
                </div>
            </td>

            {/* Phone */}
            <td className="px-4 py-3.5 hidden md:table-cell">
                <span className="text-sm text-[var(--color-neutral-600)]">
                    {customer.profile?.phone ?? '—'}
                </span>
            </td>

            {/* Filings / Docs */}
            <td className="px-4 py-3.5 hidden lg:table-cell">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-[var(--color-neutral-600)]">
                        <FolderKanban className="w-3 h-3" /> {customer._count.filings}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[var(--color-neutral-600)]">
                        <FileText className="w-3 h-3" /> {customer._count.documents}
                    </span>
                </div>
            </td>

            {/* Onboarding */}
            <td className="px-4 py-3.5 hidden xl:table-cell">
                <span className={cn(
                    'text-xs font-medium',
                    customer.profile?.onboardingDone
                        ? 'text-green-600'
                        : 'text-amber-600',
                )}>
                    {customer.profile?.onboardingDone ? '✓ Done' : 'Pending'}
                </span>
            </td>

            {/* Joined */}
            <td className="px-4 py-3.5 hidden sm:table-cell">
                <span className="text-xs text-[var(--color-neutral-500)]">
                    {formatDate(customer.createdAt)}
                </span>
            </td>

            {/* Arrow */}
            <td className="px-4 py-3.5 text-right">
                <ChevronRight className="w-4 h-4 text-[var(--color-neutral-300)] group-hover:text-indigo-500 transition-colors inline-block" />
            </td>
        </tr>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
    page, limit, total, onChange,
}: {
    page: number; limit: number; total: number; onChange: (p: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (totalPages <= 1) return null;

    // Sliding window: show 5 pages centered on current page
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + windowSize - 1);
    // Adjust start if we hit the right edge
    start = Math.max(1, end - windowSize + 1);

    const pageNumbers: number[] = [];
    for (let i = start; i <= end; i++) pageNumbers.push(i);

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-neutral-100)]">
            <span className="text-xs text-[var(--color-neutral-500)]">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-neutral-400)]
                               hover:bg-[var(--color-neutral-50)] disabled:opacity-30 transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNumbers.map((p) => (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={cn(
                            'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                            p === page
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]',
                        )}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page >= totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-neutral-400)]
                               hover:bg-[var(--color-neutral-50)] disabled:opacity-30 transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
    const router       = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') ?? '');
    const [status, setStatus] = useState(searchParams.get('status') ?? '');
    const [page, setPage]     = useState(Number(searchParams.get('page') ?? 1));
    const limit = 20;

    const debouncedSearch = useDebouncedValue(search, 300);

    // Sync filters to URL for shareability and browser back
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (status) params.set('status', status);
        if (page > 1) params.set('page', String(page));
        const qs = params.toString();
        router.replace(qs ? `?${qs}` : '/admin/customers', { scroll: false });
    }, [debouncedSearch, status, page, router]);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'customers', debouncedSearch, status, page],
        queryFn:  () => adminApi.listCustomers({ page, limit, search: debouncedSearch || undefined, status: status || undefined }),
        staleTime: 30_000,
    });

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Customers</h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">
                        {data?.total != null ? `${data.total} total customers` : 'Manage customer accounts'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <CustomerFilters
                search={search} onSearch={setSearch}
                status={status} onStatus={setStatus}
            />

            {/* Table */}
            {isLoading ? (
                <SkeletonTable rows={8} cols={5} />
            ) : isError ? (
                <EmptyState
                    title="Couldn't load customers"
                    description="Please try again."
                    action={{ label: 'Retry', onClick: () => refetch() }}
                />
            ) : !data?.data?.length ? (
                <EmptyState
                    icon={<Users className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title={search ? 'No matching customers' : 'No customers yet'}
                    description={search ? `No customers match "${search}".` : 'Customers will appear here once they register.'}
                />
            ) : (
                <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider hidden md:table-cell">Phone</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider hidden lg:table-cell">Activity</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider hidden xl:table-cell">Onboarding</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wider hidden sm:table-cell">Joined</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {data.data.map((c) => (
                                    <CustomerRow
                                        key={c.id}
                                        customer={c}
                                        onClick={() => router.push(`/admin/customers/${c.id}`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination page={page} limit={limit} total={data.total} onChange={setPage} />
                </div>
            )}
        </div>
    );
}
