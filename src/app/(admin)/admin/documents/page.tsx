'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, CheckCircle2, XCircle, RotateCcw, Eye,
    ChevronDown, ChevronUp, User, Calendar, Clock,
    Keyboard, AlertCircle, Loader2,
} from 'lucide-react';
import { cn, formatDate, formatDateTime, timeAgo, getApiError } from '@/lib/utils';
import { adminApi, type PendingDocumentItem } from '@/lib/api/admin.api';
import { documentsApi } from '@/lib/api/documents.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonTable } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
    open, onClose, onSubmit, loading,
}: {
    open: boolean; onClose: () => void;
    onSubmit: (note: string, action: 'REJECTED' | 'NEEDS_REUPLOAD') => void;
    loading: boolean;
}) {
    const [note, setNote] = useState('');
    const [action, setAction] = useState<'REJECTED' | 'NEEDS_REUPLOAD'>('NEEDS_REUPLOAD');

    // Reset state when modal opens — prevents stale note from previous rejection
    useEffect(() => {
        if (open) {
            setNote('');
            setAction('NEEDS_REUPLOAD');
        }
    }, [open]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                           w-[90vw] max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">Reject Document</h3>

                {/* Action type */}
                <div className="flex gap-2">
                    {(['NEEDS_REUPLOAD', 'REJECTED'] as const).map((a) => (
                        <button
                            key={a}
                            onClick={() => setAction(a)}
                            className={cn(
                                'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                                action === a
                                    ? 'border-red-300 bg-red-50 text-red-700'
                                    : 'border-[var(--color-neutral-200)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]',
                            )}
                        >
                            {a === 'NEEDS_REUPLOAD' ? '🔄 Ask Re-upload' : '❌ Reject Permanently'}
                        </button>
                    ))}
                </div>

                {/* Reason */}
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reason for rejection (visible to customer)..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                               text-sm placeholder:text-[var(--color-neutral-400)]
                               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                />

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(note, action)}
                        disabled={loading || !note.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                                   text-white bg-[var(--color-danger)] hover:bg-red-700 transition-all
                                   active:scale-[0.97] disabled:opacity-50"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {action === 'NEEDS_REUPLOAD' ? 'Request Re-upload' : 'Reject'}
                    </button>
                </div>
            </div>
        </>
    );
}

// ── Document queue item ────────────────────────────────────────────────────────

function QueueItem({
    doc, selected, onClick,
}: {
    doc: PendingDocumentItem; selected: boolean; onClick: () => void;
}) {
    const customerName = doc.user?.profile?.fullName ?? doc.user?.email ?? 'Unknown';

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left p-3.5 border-b border-[var(--color-neutral-50)] transition-colors',
                selected
                    ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                    : 'hover:bg-[var(--color-neutral-50)]',
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-[var(--color-neutral-900)] truncate">{doc.fileName}</p>
                <StatusBadge status={doc.status} size="sm" />
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-neutral-500)]">
                <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3" /> {customerName}
                </span>
                <span className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" /> {timeAgo(doc.createdAt)}
                </span>
            </div>
            {doc.filing && (
                <p className="text-[10px] text-[var(--color-neutral-400)] mt-1 truncate">
                    {doc.category} · {doc.filing.assessmentYear} · {doc.filing.serviceType}
                </p>
            )}
        </button>
    );
}

// ── Document viewer (right panel) ──────────────────────────────────────────────

function DocViewer({ doc }: { doc: PendingDocumentItem }) {
    const isImage = doc.mimeType.startsWith('image/');
    const isPdf   = doc.mimeType === 'application/pdf';

    const handlePreview = () => {
        documentsApi.openInNewTab(doc.id, doc.mimeType, doc.fileName);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Info header */}
            <div className="p-4 border-b border-[var(--color-neutral-100)] space-y-2">
                <p className="text-sm font-semibold text-[var(--color-neutral-900)] truncate">{doc.fileName}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-neutral-500)]">
                    <span>Category: <strong className="text-[var(--color-neutral-700)]">{doc.category}</strong></span>
                    <span>Version: <strong className="text-[var(--color-neutral-700)]">v{doc.version}</strong></span>
                    <span>Size: <strong className="text-[var(--color-neutral-700)]">{(doc.fileSize / 1024).toFixed(0)} KB</strong></span>
                    <span>Uploaded: <strong className="text-[var(--color-neutral-700)]">{formatDateTime(doc.createdAt)}</strong></span>
                </div>
                {doc.user && (
                    <p className="text-xs text-[var(--color-neutral-500)]">
                        By: <strong className="text-[var(--color-neutral-700)]">
                            {doc.user.profile?.fullName ?? doc.user.email}
                        </strong>
                    </p>
                )}
            </div>

            {/* Preview area */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-neutral-50)]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-[var(--color-neutral-100)] flex items-center justify-center mx-auto shadow-sm">
                        <FileText className="w-7 h-7 text-[var(--color-neutral-400)]" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[var(--color-neutral-700)]">
                            {isPdf ? 'PDF Document' : isImage ? 'Image' : 'Document'}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">{doc.mimeType}</p>
                    </div>
                    <button
                        onClick={handlePreview}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                                   text-white transition-all active:scale-[0.97] mx-auto"
                        style={{ background: 'var(--color-admin-bg)' }}
                    >
                        <Eye className="w-4 h-4" /> Open Preview
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Keyboard hint ──────────────────────────────────────────────────────────────

function KeyboardHint() {
    return (
        <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-[var(--color-neutral-50)]
                        border-t border-[var(--color-neutral-100)] text-[10px] text-[var(--color-neutral-400)]">
            <Keyboard className="w-3 h-3" />
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--color-neutral-200)] text-[9px]">A</kbd> Approve</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--color-neutral-200)] text-[9px]">R</kbd> Reject</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--color-neutral-200)] text-[9px]">J</kbd>/<kbd className="px-1 py-0.5 rounded bg-white border border-[var(--color-neutral-200)] text-[9px]">K</kbd> Navigate</span>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentReviewPage() {
    const queryClient = useQueryClient();
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [rejectOpen, setRejectOpen]   = useState(false);

    const { data: docs, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'pending-documents'],
        queryFn:  () => adminApi.listPendingDocuments({ limit: 100 }),
        staleTime: 15_000,
    });

    const items: PendingDocumentItem[] = (docs as PendingDocumentItem[]) ?? [];
    const selectedDoc = items[selectedIdx] ?? null;

    // ── Review mutations ──────────────────────────────────────────────────────

    const review = useMutation({
        mutationFn: ({ id, action, note }: { id: string; action: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REUPLOAD'; note?: string }) =>
            adminApi.reviewDocument(id, action, note),
        onSuccess: (_data, vars) => {
            toast.success(vars.action === 'ACCEPTED' ? 'Document approved!' : `Document ${vars.action.toLowerCase().replace(/_/g, ' ')}`);
            queryClient.invalidateQueries({ queryKey: ['admin', 'pending-documents'] });
            setRejectOpen(false);
            // Move to the next document
            if (selectedIdx >= items.length - 1) setSelectedIdx(Math.max(0, selectedIdx - 1));
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const handleApprove = useCallback(() => {
        if (!selectedDoc || review.isPending) return;
        review.mutate({ id: selectedDoc.id, action: 'ACCEPTED' });
    }, [selectedDoc, review]);

    const handleReject = useCallback((note: string, action: 'REJECTED' | 'NEEDS_REUPLOAD') => {
        if (!selectedDoc || review.isPending) return;
        review.mutate({ id: selectedDoc.id, action, note });
    }, [selectedDoc, review]);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (rejectOpen) return; // Don't capture keys while modal is open
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'a':
                    handleApprove();
                    break;
                case 'r':
                    setRejectOpen(true);
                    break;
                case 'j':
                case 'arrowdown':
                    setSelectedIdx((i) => Math.min(i + 1, items.length - 1));
                    break;
                case 'k':
                case 'arrowup':
                    setSelectedIdx((i) => Math.max(i - 1, 0));
                    break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleApprove, rejectOpen, items.length]);

    // ── Render ─────────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="skeleton h-6 w-40 rounded" />
                </div>
                <SkeletonTable rows={8} cols={4} />
            </div>
        );
    }

    if (isError) {
        return <EmptyState title="Couldn't load review queue" action={{ label: 'Retry', onClick: () => refetch() }} />;
    }

    if (items.length === 0) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Document Review</h1>
                <EmptyState
                    icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
                    title="All caught up!"
                    description="There are no documents waiting for review."
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Document Review</h1>
                    <p className="text-sm text-[var(--color-neutral-500)] mt-0.5">{items.length} pending</p>
                </div>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0 rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden"
                 style={{ height: 'calc(100vh - 200px)' }}>

                {/* Left: queue list */}
                <div className="flex flex-col border-r border-[var(--color-neutral-100)]">
                    <div className="flex-1 overflow-y-auto">
                        {items.map((doc, i) => (
                            <QueueItem
                                key={doc.id}
                                doc={doc}
                                selected={i === selectedIdx}
                                onClick={() => setSelectedIdx(i)}
                            />
                        ))}
                    </div>
                    <KeyboardHint />
                </div>

                {/* Right: viewer + actions */}
                <div className="flex flex-col">
                    {selectedDoc ? (
                        <>
                            <div className="flex-1 overflow-y-auto">
                                <DocViewer doc={selectedDoc} />
                            </div>

                            {/* Action bar */}
                            <div className="flex items-center gap-3 p-4 border-t border-[var(--color-neutral-100)] bg-white">
                                <button
                                    onClick={handleApprove}
                                    disabled={review.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                                               text-sm font-semibold text-white bg-[var(--color-success)]
                                               hover:bg-green-700 transition-all active:scale-[0.97]"
                                >
                                    {review.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => setRejectOpen(true)}
                                    disabled={review.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                                               text-sm font-semibold text-white bg-[var(--color-danger)]
                                               hover:bg-red-700 transition-all active:scale-[0.97]"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-[var(--color-neutral-400)]">Select a document to review</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject modal */}
            <RejectModal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                onSubmit={handleReject}
                loading={review.isPending}
            />
        </div>
    );
}
