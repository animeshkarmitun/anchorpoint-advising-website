'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Save, Trash2, Loader2,
    Plus, CheckCircle2, AlertTriangle, Eye, X,
} from 'lucide-react';
import { cn, getApiError } from '@/lib/utils';
import { seoApi, type SeoRecord } from '@/lib/api/cms.api';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { SkeletonTable } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Known pages that should have SEO ──────────────────────────────────────────

const KNOWN_PAGES = [
    'home', 'about', 'services', 'pricing',
    'contact', 'blog', 'faq', 'privacy-policy',
    'terms-of-service', 'corporate-tax', 'vat-return',
    'individual-tax', 'late-filing',
];

// ── SEO edit modal ────────────────────────────────────────────────────────────

function SeoEditModal({
    record, page, locale, onClose,
}: {
    record?: SeoRecord | null;
    page: string;
    locale: string;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [ogImage, setOgImage] = useState('');
    const [canonical, setCanonical] = useState('');
    const [keywords, setKeywords] = useState('');

    useEffect(() => {
        if (record) {
            setMetaTitle(record.metaTitle ?? '');
            setMetaDescription(record.metaDescription ?? '');
            setOgImage(record.ogImage ?? '');
            setCanonical(record.canonical ?? '');
            setKeywords(record.keywords ?? '');
        } else {
            setMetaTitle('');
            setMetaDescription('');
            setOgImage('');
            setCanonical('');
            setKeywords('');
        }
    }, [record]);

    const save = useMutation({
        mutationFn: () => seoApi.upsert(page, locale, {
            metaTitle, metaDescription, ogImage: ogImage || undefined,
            canonical: canonical || undefined, keywords: keywords || undefined,
        }),
        onSuccess: () => {
            toast.success(`SEO for "${page}" saved`);
            queryClient.invalidateQueries({ queryKey: ['admin', 'seo'] });
            onClose();
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const titleLen = metaTitle.length;
    const descLen = metaDescription.length;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                           w-[90vw] max-w-2xl bg-white rounded-2xl shadow-xl p-6 space-y-5 animate-scale-in max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">
                        SEO — <span className="text-indigo-600">/{page}</span>
                    </h3>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--color-neutral-50)] transition-all">
                        <X className="w-4 h-4 text-[var(--color-neutral-500)]" />
                    </button>
                </div>

                {/* Meta Title */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[var(--color-neutral-700)]">Meta Title</label>
                        <span className={cn('text-[10px] font-medium', titleLen > 60 ? 'text-red-500' : titleLen > 50 ? 'text-amber-500' : 'text-green-600')}>
                            {titleLen}/60
                        </span>
                    </div>
                    <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        maxLength={80}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                   text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                {/* Meta Description */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[var(--color-neutral-700)]">Meta Description</label>
                        <span className={cn('text-[10px] font-medium', descLen > 160 ? 'text-red-500' : descLen > 140 ? 'text-amber-500' : 'text-green-600')}>
                            {descLen}/160
                        </span>
                    </div>
                    <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        maxLength={200}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                   text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                    />
                </div>

                {/* Google SERP preview */}
                <div>
                    <p className="text-xs font-semibold text-[var(--color-neutral-700)] mb-2 flex items-center gap-1">
                        <Eye className="w-3  h-3" /> Google Preview
                    </p>
                    <div className="bg-[var(--color-neutral-50)] rounded-lg p-4 border border-[var(--color-neutral-100)]">
                        <p className="text-lg text-blue-800 font-normal truncate" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {metaTitle || 'Page Title'}
                        </p>
                        <p className="text-xs text-green-700 mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                            https://anchorpointadvising.com/{page}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-600)] mt-1 line-clamp-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {metaDescription || 'Add a meta description to see how this page will appear in search results.'}
                        </p>
                    </div>
                </div>

                {/* OG Image */}
                <div>
                    <label className="text-xs font-semibold text-[var(--color-neutral-700)] mb-1 block">OG Image URL</label>
                    <input
                        type="text"
                        value={ogImage}
                        onChange={(e) => setOgImage(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                   text-sm placeholder:text-[var(--color-neutral-400)]
                                   focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                </div>

                {/* Canonical + Keywords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-[var(--color-neutral-700)] mb-1 block">Canonical URL</label>
                        <input
                            type="text"
                            value={canonical}
                            onChange={(e) => setCanonical(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                       text-sm placeholder:text-[var(--color-neutral-400)]
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--color-neutral-700)] mb-1 block">Keywords</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="tax, filing, bangladesh"
                            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                       text-sm placeholder:text-[var(--color-neutral-400)]
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={() => save.mutate()}
                        disabled={!metaTitle.trim() || !metaDescription.trim() || save.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                                   text-white transition-all active:scale-[0.97] disabled:opacity-50"
                        style={{ background: 'var(--color-admin-accent, #4F46E5)' }}
                    >
                        {save.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                    </button>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SeoPage() {
    const queryClient = useQueryClient();
    const [locale, setLocale] = useState<'en' | 'bn'>('en');
    const [editTarget, setEditTarget] = useState<{ page: string; record?: SeoRecord } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ page: string; locale: string } | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'seo', locale],
        queryFn: () => seoApi.listAll(locale),
        staleTime: 30_000,
    });

    const records: SeoRecord[] = Array.isArray(data) ? data : [];

    const deleteMut = useMutation({
        mutationFn: () => seoApi.delete(deleteTarget!.page, deleteTarget!.locale),
        onSuccess: () => {
            toast.success('SEO record deleted');
            queryClient.invalidateQueries({ queryKey: ['admin', 'seo'] });
            setDeleteTarget(null);
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    // Compute coverage: which known pages have records?
    const recordMap = Object.fromEntries(records.map((r) => [r.page, r]));
    const covered = KNOWN_PAGES.filter((p) => recordMap[p]);
    const missing = KNOWN_PAGES.filter((p) => !recordMap[p]);

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">SEO Management</h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">
                        {covered.length}/{KNOWN_PAGES.length} pages configured · {locale === 'en' ? 'English' : 'বাংলা'}
                    </p>
                </div>

                {/* Locale toggle */}
                <div className="flex gap-1 bg-[var(--color-neutral-100)] rounded-lg p-0.5">
                    {(['en', 'bn'] as const).map((l) => (
                        <button
                            key={l}
                            onClick={() => setLocale(l)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                locale === l
                                    ? 'bg-white text-[var(--color-neutral-900)] shadow-sm'
                                    : 'text-[var(--color-neutral-500)]',
                            )}
                        >
                            {l === 'en' ? '🇬🇧 EN' : '🇧🇩 BN'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Missing pages callout */}
            {missing.length > 0 && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> {missing.length} pages missing SEO
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {missing.map((page) => (
                            <button
                                key={page}
                                onClick={() => setEditTarget({ page })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium
                                           bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all"
                            >
                                <Plus className="w-3 h-3" /> /{page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <SkeletonTable rows={6} cols={4} />
            ) : isError ? (
                <EmptyState title="Failed to load SEO data" action={{ label: 'Retry', onClick: () => refetch() }} />
            ) : records.length === 0 ? (
                <EmptyState
                    icon={<Search className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title="No SEO records yet"
                    description="Click on a missing page above to add SEO data."
                />
            ) : (
                <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Page</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase">Title</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden md:table-cell">Description</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-[var(--color-neutral-500)] uppercase hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 w-24" />
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => {
                                    const titleOk = r.metaTitle.length > 0 && r.metaTitle.length <= 60;
                                    const descOk = r.metaDescription.length > 0 && r.metaDescription.length <= 160;
                                    const allOk = titleOk && descOk;

                                    return (
                                        <tr key={r.id} className="border-b border-[var(--color-neutral-50)] last:border-0 hover:bg-[var(--color-neutral-50)]/50">
                                            <td className="px-4 py-3.5">
                                                <span className="text-sm font-medium text-indigo-600">/{r.page}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-sm text-[var(--color-neutral-800)] truncate max-w-[200px]">{r.metaTitle}</p>
                                                <span className={cn('text-[10px] font-medium', titleOk ? 'text-green-600' : 'text-red-500')}>
                                                    {r.metaTitle.length}/60
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 hidden md:table-cell">
                                                <p className="text-xs text-[var(--color-neutral-600)] truncate max-w-[300px]">{r.metaDescription}</p>
                                                <span className={cn('text-[10px] font-medium', descOk ? 'text-green-600' : 'text-red-500')}>
                                                    {r.metaDescription.length}/160
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 hidden sm:table-cell">
                                                {allOk ? (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> OK
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Fix
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setEditTarget({ page: r.page, record: r })}
                                                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium
                                                                   border border-[var(--color-neutral-200)] text-[var(--color-neutral-600)]
                                                                   hover:bg-[var(--color-neutral-50)] transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget({ page: r.page, locale })}
                                                        className="px-2 py-1 rounded-lg text-[10px]
                                                                   text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editTarget && (
                <SeoEditModal
                    page={editTarget.page}
                    record={editTarget.record}
                    locale={locale}
                    onClose={() => setEditTarget(null)}
                />
            )}

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteMut.mutate()}
                title="Delete SEO Record?"
                description={`This will remove the custom SEO data for "/${deleteTarget?.page}" and fall back to defaults.`}
                confirmLabel="Delete"
                confirmVariant="danger"
                loading={deleteMut.isPending}
            />
        </div>
    );
}
