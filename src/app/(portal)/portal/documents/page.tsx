'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Upload, Camera, CheckCircle2, Circle, AlertCircle,
    FileText, Eye, RefreshCw, FolderOpen, ChevronDown,
} from 'lucide-react';
import { cn, formatDate, getApiError } from '@/lib/utils';
import { documentsApi } from '@/lib/api/documents.api';
import type { ChecklistItem } from '@/lib/api/documents.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

// ── File validation (client-side first layer) ─────────────────────────────────

const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const MAX_SIZE_MB = 10;

function validateFile(file: File): string | null {
    if (!ALLOWED_MIME.has(file.type))
        return `File type "${file.type}" is not allowed. Upload PDF, JPG, PNG or DOCX.`;
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
        return `File is too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    return null;
}

// ── Upload drop zone ──────────────────────────────────────────────────────────

function DropZone({
    onFiles,
    disabled,
    category,
}: {
    onFiles: (files: FileList) => void;
    disabled?: boolean;
    category: string;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files);
        },
        [onFiles],
    );

    return (
        <div
            className={cn(
                'rounded-xl border-2 border-dashed transition-all duration-200 text-center p-6',
                dragging
                    ? 'border-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/5'
                    : 'border-[var(--color-neutral-200)] hover:border-[var(--color-portal-primary)]/40',
                disabled && 'opacity-50 pointer-events-none',
            )}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#1B3A6B]/10">
                    <Upload className="w-5 h-5 text-[var(--color-portal-primary)]" />
                </div>
                <div>
                    <p className="text-sm font-medium text-[var(--color-neutral-700)]">
                        Drop file here, or
                    </p>
                    <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">
                        PDF, JPG, PNG or DOCX · max {MAX_SIZE_MB} MB
                    </p>
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    className="hidden"
                    onChange={(e) => e.target.files && onFiles(e.target.files)}
                />
                {/* Camera capture — mobile */}
                <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files && onFiles(e.target.files)}
                />

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                       text-white transition-all active:scale-[0.97]"
                        style={{ background: 'var(--color-portal-primary)' }}
                    >
                        <FolderOpen className="w-3.5 h-3.5" /> Choose File
                    </button>
                    {/* Camera button — shows on all devices, useful on mobile */}
                    <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                       border border-[var(--color-neutral-200)] text-[var(--color-neutral-700)]
                       hover:bg-[var(--color-neutral-50)] transition-all"
                    >
                        <Camera className="w-3.5 h-3.5" /> Take Photo
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Upload progress item ───────────────────────────────────────────────────────

function UploadingItem({ file, category, filingId, onDone }: {
    file: File;
    category: string;
    filingId?: string;
    onDone: () => void;
}) {
    const queryClient = useQueryClient();

    const upload = useMutation({
        mutationFn: () => documentsApi.upload(file, category, filingId),
        onSuccess: () => {
            toast.success(`${file.name} uploaded successfully!`);
            queryClient.invalidateQueries({ queryKey: ['checklist'] });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            onDone();
        },
        onError: (err) => {
            toast.error(getApiError(err));
            onDone();
        },
    });

    // Fire upload once on mount — useEffect (not useState initializer) to avoid
    // running during render and to respect React Strict Mode's double-invocation.
    useEffect(() => {
        upload.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally stable — fire once per component mount

    const pct = upload.isPending ? 65 : upload.isSuccess ? 100 : 0;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-100)]">
            <FileText className="w-4 h-4 text-[var(--color-neutral-400)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-neutral-700)] truncate">{file.name}</p>
                <div className="mt-1 w-full h-1.5 bg-[var(--color-neutral-200)] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${pct}%`,
                            background: upload.isSuccess ? 'var(--color-success)' : 'var(--color-portal-primary)',
                        }}
                    />
                </div>
            </div>
            {upload.isSuccess && <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] flex-shrink-0" />}
            {upload.isError && <AlertCircle className="w-4 h-4 text-[var(--color-danger)] flex-shrink-0" />}
        </div>
    );
}

// ── Checklist item row ────────────────────────────────────────────────────────

function ChecklistRow({
    item,
    filingId,
    expanded,
    onToggle,
}: {
    item: ChecklistItem;
    filingId: string;
    expanded: boolean;
    onToggle: () => void;
}) {
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const accepted = item.document?.status === 'ACCEPTED';
    const rejected = ['REJECTED', 'NEEDS_REUPLOAD'].includes(item.document?.status ?? '');
    const pending = item.document?.status === 'PENDING';
    const hasDoc = !!item.document;

    const handleFiles = (files: FileList) => {
        const file = files[0];
        if (!file) return;
        const err = validateFile(file);
        if (err) { toast.error(err); return; }
        setPendingFiles((p) => [...p, file]);
    };

    return (
        <li className="border border-[var(--color-neutral-100)] rounded-xl overflow-hidden">
            {/* Row header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--color-neutral-50)] transition-colors"
            >
                {/* Status icon */}
                <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    accepted ? 'text-[var(--color-success)]' :
                        rejected ? 'bg-red-50' :
                            pending ? 'bg-amber-50' : 'bg-[var(--color-neutral-100)]',
                )}>
                    {accepted ? <CheckCircle2 className="w-5 h-5" /> :
                        rejected ? <AlertCircle className="w-4 h-4 text-[var(--color-danger)]" /> :
                            pending ? <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" /> :
                                <Circle className="w-4 h-4 text-[var(--color-neutral-300)]" />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-neutral-900)] truncate">{item.label}</p>
                    {item.description && (
                        <p className="text-xs text-[var(--color-neutral-400)] mt-0.5 truncate">{item.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {item.isRequired && !accepted && (
                        <span className="text-[10px] font-semibold text-[var(--color-danger)] bg-red-50 px-1.5 py-0.5 rounded">
                            Required
                        </span>
                    )}
                    {hasDoc && <StatusBadge status={item.document!.status} size="sm" />}
                    <ChevronDown
                        className={cn('w-4 h-4 text-[var(--color-neutral-400)] transition-transform', expanded && 'rotate-180')}
                    />
                </div>
            </button>

            {/* Expanded upload panel */}
            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-neutral-100)] pt-3 animate-fade-in">
                    {/* Rejection note */}
                    {rejected && item.document?.rejectionNote && (
                        <div className="flex gap-2 p-3 rounded-lg bg-red-50 text-xs text-red-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Note: {item.document.rejectionNote}</span>
                        </div>
                    )}

                    {/* Current document preview */}
                    {hasDoc && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                            <FileText className="w-4 h-4 text-[var(--color-neutral-400)]" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--color-neutral-700)] truncate">{item.document!.fileName}</p>
                                <p className="text-[10px] text-[var(--color-neutral-400)]">
                                    Uploaded {formatDate(item.document!.createdAt)} · v{item.document!.version}
                                </p>
                            </div>
                            {accepted && (
                                <button
                                    onClick={() => documentsApi.openInNewTab(
                                        item.document!.id,
                                        item.document!.mimeType,
                                        item.document!.fileName,
                                    )}
                                    className="flex items-center gap-1 text-xs text-[var(--color-portal-primary)] hover:underline"
                                >
                                    <Eye className="w-3 h-3" /> View
                                </button>
                            )}
                        </div>
                    )}

                    {/* Upload zone — show for missing, rejected, or reupload needed */}
                    {(!hasDoc || rejected) && (
                        <DropZone
                            onFiles={handleFiles}
                            category={item.category}
                            disabled={accepted || pending}
                        />
                    )}

                    {/* In-flight uploads */}
                    {pendingFiles.map((f) => (
                        <UploadingItem
                            key={`${f.name}-${f.size}-${f.lastModified}`}
                            file={f}
                            category={item.category}
                            filingId={filingId}
                            onDone={() => setPendingFiles((p) => p.filter((pf) => pf !== f))}
                        />
                    ))}
                </div>
            )}
        </li>
    );
}

// ── Documents page ─────────────────────────────────────────────────────────────

function DocumentsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filingId = searchParams.get('filingId') ?? '';
    const [expanded, setExpanded] = useState<string | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['checklist', filingId],
        queryFn: () => documentsApi.getChecklist(filingId),
        enabled: !!filingId,
        staleTime: 30_000,
    });

    const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id));

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Documents</h1>
                <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">
                    Upload and manage the documents required for your filing
                </p>
            </div>

            {!filingId ? (
                <EmptyState
                    icon={<FolderOpen className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                    title="No filing selected"
                    description="Go to your dashboard to select an active filing, then return here to upload documents."
                    action={{
                        label: 'Go to Dashboard',
                        onClick: () => router.push('/portal/dashboard'),
                    }}
                />
            ) : isLoading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                </div>
            ) : isError ? (
                <EmptyState
                    title="Couldn't load your checklist"
                    description="Please try again."
                    action={{ label: 'Retry', onClick: () => refetch() }}
                />
            ) : (
                <>
                    {/* Progress summary */}
                    <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[var(--color-neutral-900)]">
                                Checklist progress
                            </span>
                            <span className="text-sm font-bold" style={{ color: data?.completionRate === 100 ? 'var(--color-success)' : 'var(--color-portal-primary)' }}>
                                {data?.completionRate ?? 0}%
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-[var(--color-neutral-100)] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${data?.completionRate ?? 0}%`,
                                    background: data?.completionRate === 100 ? 'var(--color-success)' : 'var(--color-portal-primary)',
                                }}
                            />
                        </div>
                        <p className="text-xs text-[var(--color-neutral-400)] mt-1.5">
                            {data?.checklist.filter((c) => c.document?.status === 'ACCEPTED').length ?? 0} of{' '}
                            {data?.checklist.length ?? 0} documents accepted
                        </p>
                    </div>

                    {/* Checklist items */}
                    <ul className="space-y-2">
                        {data?.checklist.map((item) => (
                            <ChecklistRow
                                key={item.id}
                                item={item}
                                filingId={filingId}
                                expanded={expanded === item.id}
                                onToggle={() => toggle(item.id)}
                            />
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

// ── Page wrapper with Suspense (useSearchParams requires it in Next.js 16) ────

export default function DocumentsPage() {
    return (
        <Suspense fallback={
            <div className="space-y-5 max-w-2xl">
                <div className="skeleton h-8 w-48 rounded" />
                <div className="skeleton h-24 rounded-xl" />
                <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                </div>
            </div>
        }>
            <DocumentsPageContent />
        </Suspense>
    );
}
