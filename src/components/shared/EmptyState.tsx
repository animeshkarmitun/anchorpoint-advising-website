'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-neutral-100)] flex items-center justify-center mb-4">
                <span className="text-[var(--color-neutral-400)] text-2xl">{icon ?? '📭'}</span>
            </div>
            <h3 className="font-semibold text-[var(--color-neutral-700)] mb-1.5">{title}</h3>
            {description && (
                <p className="text-sm text-[var(--color-neutral-400)] max-w-sm leading-relaxed">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.98]"
                    style={{ background: 'var(--color-portal-primary)' }}
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[var(--color-danger)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-neutral-700)] mb-1">Something went wrong</h3>
            <p className="text-sm text-[var(--color-neutral-400)] mb-5 max-w-xs">
                {message ?? 'Could not load this data. Please try again.'}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     border border-[var(--color-neutral-200)] text-[var(--color-neutral-700)]
                     hover:bg-[var(--color-neutral-50)] transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> Try again
                </button>
            )}
        </div>
    );
}
