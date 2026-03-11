'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Mail, Phone, Calendar, FileText,
    FolderKanban, Shield, UserX, UserCheck, Loader2,
    ChevronRight, Clock, AlertCircle,
} from 'lucide-react';
import { cn, formatDate, formatDateTime, timeAgo, getApiError, maskSensitive } from '@/lib/utils';
import { adminApi, type CustomerDetail, type FilingListItem, type ActivityItem } from '@/lib/api/admin.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { SkeletonCard } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
    { key: 'overview',  label: 'Overview' },
    { key: 'filings',   label: 'Filings' },
    { key: 'documents', label: 'Documents' },
    { key: 'activity',  label: 'Activity' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ customer }: { customer: CustomerDetail }) {
    const info = [
        { icon: Mail,     label: 'Email',    value: customer.email },
        { icon: Phone,    label: 'Phone',    value: customer.profile?.phone ?? '—' },
        { icon: Calendar, label: 'Joined',   value: formatDate(customer.createdAt) },
        { icon: Shield,   label: 'NID',      value: customer.profile?.nid ? maskSensitive(customer.profile.nid) : '—' },
    ];

    return (
        <div className="space-y-4">
            {/* Info card */}
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-3">Personal Information</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {info.map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[var(--color-neutral-100)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
                            </div>
                            <div>
                                <dt className="text-[10px] text-[var(--color-neutral-400)] uppercase tracking-wider">{label}</dt>
                                <dd className="text-sm text-[var(--color-neutral-900)] font-medium">{value}</dd>
                            </div>
                        </div>
                    ))}
                </dl>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                    { label: 'Filings',   value: customer._count.filings,   icon: FolderKanban },
                    { label: 'Documents', value: customer._count.documents, icon: FileText },
                    { label: 'Onboarding', value: customer.profile?.onboardingDone ? 'Done' : 'Pending', icon: Shield },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4">
                        <Icon className="w-4 h-4 text-[var(--color-neutral-400)] mb-2" />
                        <p className="text-lg font-bold text-[var(--color-neutral-900)]">{value}</p>
                        <p className="text-xs text-[var(--color-neutral-500)]">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Filings tab ───────────────────────────────────────────────────────────────

function FilingsTab({ customerId }: { customerId: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'customer-filings', customerId],
        queryFn:  () => adminApi.getCustomerFilings(customerId),
    });

    if (isLoading) return <SkeletonCard className="h-48" />;

    const filings: FilingListItem[] = Array.isArray(data) ? data : [];

    if (filings.length === 0) {
        return (
            <EmptyState
                icon={<FolderKanban className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                title="No filings"
                description="This customer hasn't started any filings yet."
            />
        );
    }

    return (
        <div className="space-y-2">
            {filings.map((f) => (
                <Link
                    key={f.id}
                    href={`/admin/filings?filingId=${f.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white border border-[var(--color-neutral-100)]
                               hover:border-indigo-200 hover:shadow-sm transition-all group"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium text-[var(--color-neutral-900)]">{f.assessmentYear}</p>
                            <StatusBadge status={f.status} size="sm" />
                        </div>
                        <p className="text-xs text-[var(--color-neutral-500)]">{f.serviceType} · {formatDate(f.createdAt)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-neutral-300)] group-hover:text-indigo-500" />
                </Link>
            ))}
        </div>
    );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab({ customerId }: { customerId: string }) {
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'customer-documents', customerId],
        queryFn:  () => adminApi.getCustomerDocuments(customerId),
    });

    if (isLoading) return <SkeletonCard className="h-48" />;

    const docs = Array.isArray(data) ? data : [];

    if (docs.length === 0) {
        return (
            <EmptyState
                icon={<FileText className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                title="No documents"
                description="This customer hasn't uploaded any documents yet."
            />
        );
    }

    return (
        <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                        <th className="px-4 py-2.5 text-xs font-semibold text-[var(--color-neutral-500)]">File</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[var(--color-neutral-500)] hidden sm:table-cell">Category</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[var(--color-neutral-500)]">Status</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[var(--color-neutral-500)] hidden md:table-cell">Uploaded</th>
                    </tr>
                </thead>
                <tbody>
                    {docs.map((d: { id: string; fileName: string; category: string; status: string; createdAt: string }) => (
                        <tr key={d.id} className="border-b border-[var(--color-neutral-50)] last:border-0">
                            <td className="px-4 py-3">
                                <p className="text-sm text-[var(--color-neutral-900)] truncate max-w-[200px]">{d.fileName}</p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-xs text-[var(--color-neutral-600)]">{d.category}</span>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={d.status} size="sm" /></td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-xs text-[var(--color-neutral-500)]">{formatDate(d.createdAt)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Activity tab ──────────────────────────────────────────────────────────────

function ActivityTab({ items }: { items?: ActivityItem[] }) {
    if (!items?.length) {
        return <EmptyState title="No recent activity" description="Activity for this customer will appear here." />;
    }

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[var(--color-neutral-100)]">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-neutral-100)] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-neutral-500)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--color-neutral-700)]">{item.description}</p>
                        <p className="text-[10px] text-[var(--color-neutral-400)] mt-0.5">{formatDateTime(item.createdAt)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
    const { id }   = useParams<{ id: string }>();
    const router   = useRouter();
    const queryClient = useQueryClient();

    const [tab, setTab]             = useState<TabKey>('overview');
    const [suspendOpen, setSuspendOpen] = useState(false);

    const { data: customer, isLoading, isError } = useQuery({
        queryKey: ['admin', 'customer', id],
        queryFn:  () => adminApi.getCustomerDetail(id),
        staleTime: 30_000,
    });

    const suspend = useMutation({
        mutationFn: () => customer?.status === 'SUSPENDED'
            ? adminApi.activateCustomer(id)
            : adminApi.suspendCustomer(id),
        onSuccess: () => {
            toast.success(customer?.status === 'SUSPENDED' ? 'Customer activated' : 'Customer suspended');
            queryClient.invalidateQueries({ queryKey: ['admin', 'customer', id] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
            setSuspendOpen(false);
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-4xl">
                <div className="skeleton h-8 w-40 rounded" />
                <SkeletonCard className="h-48" />
                <SkeletonCard className="h-64" />
            </div>
        );
    }

    if (isError || !customer) {
        return (
            <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-[var(--color-danger)] mx-auto mb-3" />
                <p className="text-sm text-[var(--color-neutral-700)]">Customer not found.</p>
                <button onClick={() => router.back()} className="mt-4 text-sm text-indigo-600 hover:underline">← Go back</button>
            </div>
        );
    }

    const name = customer.profile?.fullName ?? customer.email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    const isSuspended = customer.status === 'SUSPENDED';

    return (
        <div className="space-y-5 max-w-4xl">
            {/* Back + header */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-neutral-200)]
                               hover:bg-[var(--color-neutral-50)] transition-all mt-1"
                >
                    <ArrowLeft className="w-4 h-4 text-[var(--color-neutral-600)]" />
                </button>

                <div className="flex-1 min-w-0 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase"
                             style={{ background: 'var(--color-admin-bg)' }}>
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--color-neutral-900)]">{name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <StatusBadge status={isSuspended ? 'SUSPENDED' : 'ACTIVE'} size="sm" />
                                <span className="text-xs text-[var(--color-neutral-500)]">{customer.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => setSuspendOpen(true)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                            isSuspended
                                ? 'border-green-200 text-green-700 hover:bg-green-50'
                                : 'border-red-200 text-red-600 hover:bg-red-50',
                        )}
                    >
                        {isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        {isSuspended ? 'Activate' : 'Suspend'}
                    </button>
                </div>
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
            <div>
                {tab === 'overview'  && <OverviewTab customer={customer} />}
                {tab === 'filings'   && <FilingsTab customerId={id} />}
                {tab === 'documents' && <DocumentsTab customerId={id} />}
                {tab === 'activity'  && <ActivityTab items={customer.recentActivity} />}
            </div>

            {/* Suspend confirm */}
            <ConfirmDialog
                open={suspendOpen}
                onClose={() => setSuspendOpen(false)}
                onConfirm={() => suspend.mutate()}
                title={isSuspended ? 'Activate Customer' : 'Suspend Customer'}
                description={isSuspended
                    ? `Reactivate ${name}'s account? They will regain access to the portal.`
                    : `Suspend ${name}'s account? They will be locked out of the portal immediately.`}
                confirmLabel={isSuspended ? 'Activate' : 'Suspend'}
                confirmVariant={isSuspended ? 'primary' : 'danger'}
                loading={suspend.isPending}
            />
        </div>
    );
}
