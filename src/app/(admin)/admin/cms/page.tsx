'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Save, Loader2, Globe,
    ChevronRight, RotateCcw,
} from 'lucide-react';
import { cn, getApiError } from '@/lib/utils';
import { cmsApi, type CmsSection } from '@/lib/api/cms.api';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { SkeletonCard } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Known sections for discovery ──────────────────────────────────────────────

const KNOWN_SECTIONS = [
    { key: 'hero', label: 'Hero Banner' },
    { key: 'about', label: 'About Us' },
    { key: 'services', label: 'Services' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'faq', label: 'FAQ' },
    { key: 'contact', label: 'Contact' },
    { key: 'footer', label: 'Footer' },
];

const LOCALES = ['en', 'bn'] as const;

// ── JSON editor ───────────────────────────────────────────────────────────────

function JsonEditor({
    value, onChange,
}: {
    value: string; onChange: (v: string) => void;
}) {
    const [error, setError] = useState('');

    const handleChange = (raw: string) => {
        onChange(raw);
        try {
            JSON.parse(raw);
            setError('');
        } catch (e) {
            setError('Invalid JSON');
        }
    };

    return (
        <div className="relative">
            <textarea
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                spellCheck={false}
                className={cn(
                    'w-full h-[400px] font-mono text-xs px-4 py-3 rounded-lg border',
                    'bg-[var(--color-neutral-50)] text-[var(--color-neutral-800)]',
                    'focus:outline-none focus:ring-2 resize-none',
                    error ? 'border-red-300 focus:ring-red-200' : 'border-[var(--color-neutral-200)] focus:ring-indigo-200',
                )}
            />
            {error && (
                <p className="absolute bottom-2 right-3 text-[10px] text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CmsPage() {
    const queryClient = useQueryClient();
    const [selectedSection, setSelectedSection] = useState('hero');
    const [locale, setLocale] = useState<'en' | 'bn'>('en');
    const [jsonText, setJsonText] = useState('{}');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'cms'],
        queryFn: () => cmsApi.listAll(),
        staleTime: 30_000,
    });

    const sections: CmsSection[] = Array.isArray(data) ? data : [];

    // Find the section data for current selection + locale
    const currentData = sections.find(
        (s) => s.section === selectedSection && s.locale === locale
    );

    // Sync editor when switching section/locale
    useEffect(() => {
        if (currentData) {
            setJsonText(JSON.stringify(currentData.data, null, 2));
        } else {
            setJsonText('{\n  \n}');
        }
    }, [selectedSection, locale, currentData]);

    const saveMut = useMutation({
        mutationFn: () => {
            const parsed = JSON.parse(jsonText);
            return cmsApi.upsert(selectedSection, locale, parsed);
        },
        onSuccess: () => {
            toast.success(`${selectedSection} (${locale}) saved`);
            queryClient.invalidateQueries({ queryKey: ['admin', 'cms'] });
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const deleteMut = useMutation({
        mutationFn: () => cmsApi.delete(deleteTarget!, locale),
        onSuccess: () => {
            toast.success('Section reverted to defaults');
            queryClient.invalidateQueries({ queryKey: ['admin', 'cms'] });
            setDeleteTarget(null);
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const isValidJson = (() => {
        try { JSON.parse(jsonText); return true; }
        catch { return false; }
    })();

    const sectionLabel = KNOWN_SECTIONS.find((s) => s.key === selectedSection)?.label ?? selectedSection;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">CMS Content</h1>
                <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">Edit website content by section and locale</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left: Section list */}
                <div className="lg:w-[220px] flex-shrink-0">
                    <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] overflow-hidden">
                        <p className="px-4 py-2.5 text-[10px] font-semibold text-[var(--color-neutral-400)] uppercase border-b border-[var(--color-neutral-100)]">
                            Sections
                        </p>
                        {KNOWN_SECTIONS.map((s) => {
                            const hasData = sections.some((d) => d.section === s.key);
                            return (
                                <button
                                    key={s.key}
                                    onClick={() => setSelectedSection(s.key)}
                                    className={cn(
                                        'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all',
                                        selectedSection === s.key
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]',
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5" />
                                        {s.label}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        {hasData && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                        <ChevronRight className="w-3 h-3 text-[var(--color-neutral-400)]" />
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Center: Editor */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base font-semibold text-[var(--color-neutral-900)]">{sectionLabel}</h2>
                            {/* Locale switcher */}
                            <div className="flex gap-1 bg-[var(--color-neutral-100)] rounded-lg p-0.5">
                                {LOCALES.map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLocale(l)}
                                        className={cn(
                                            'px-3 py-1 rounded-md text-xs font-medium transition-all',
                                            locale === l
                                                ? 'bg-white text-[var(--color-neutral-900)] shadow-sm'
                                                : 'text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]',
                                        )}
                                    >
                                        <Globe className="w-3 h-3 inline mr-1" />
                                        {l === 'en' ? 'English' : 'বাংলা'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentData && (
                                <button
                                    onClick={() => setDeleteTarget(selectedSection)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                               border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                                >
                                    <RotateCcw className="w-3 h-3" /> Revert
                                </button>
                            )}
                            <button
                                onClick={() => saveMut.mutate()}
                                disabled={!isValidJson || saveMut.isPending}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                                           text-white transition-all active:scale-[0.97] disabled:opacity-50"
                                style={{ background: 'var(--color-admin-accent, #4F46E5)' }}
                            >
                                {saveMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <SkeletonCard className="h-[400px]" />
                    ) : isError ? (
                        <EmptyState title="Failed to load" action={{ label: 'Retry', onClick: () => refetch() }} />
                    ) : (
                        <JsonEditor value={jsonText} onChange={setJsonText} />
                    )}

                    {currentData && (
                        <p className="text-[10px] text-[var(--color-neutral-400)]">
                            Last updated: {new Date(currentData.updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteMut.mutate()}
                title="Revert to Defaults?"
                description={`This will delete the custom "${sectionLabel}" content for ${locale === 'en' ? 'English' : 'বাংলা'} and fall back to the default JSON file.`}
                confirmLabel="Revert"
                confirmVariant="danger"
                loading={deleteMut.isPending}
            />
        </div>
    );
}
