'use client';

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description?: string;
    confirmLabel?: string;
    confirmVariant?: 'danger' | 'primary';
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = 'Confirm',
    confirmVariant = 'danger',
    loading = false,
}: ConfirmDialogProps) {
    if (!open) return null;

    const isDanger = confirmVariant === 'danger';

    const btnColor = isDanger
        ? 'bg-[var(--color-danger)] hover:bg-red-700'
        : 'bg-[var(--color-admin-bg)] hover:bg-indigo-800';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                           w-[90vw] max-w-md bg-white rounded-2xl shadow-xl p-6 animate-scale-in">
                <div className="flex items-start gap-4">
                    {/* Icon — varies by variant */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isDanger ? 'bg-red-50' : 'bg-indigo-50'}`}>
                        {isDanger
                            ? <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />
                            : <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">{title}</h3>
                        {description && (
                            <p className="text-sm text-[var(--color-neutral-500)] mt-1.5 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-sm font-medium
                                   border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-700)]
                                   hover:bg-[var(--color-neutral-50)] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                                   text-white transition-all active:scale-[0.97] ${btnColor}`}
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </>
    );
}
