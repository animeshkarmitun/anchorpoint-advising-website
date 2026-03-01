import { cn } from '@/lib/utils';

interface SkeletonProps { className?: string; style?: React.CSSProperties }

export function SkeletonLine({ className, style }: SkeletonProps) {
    return <div className={cn('skeleton rounded', className)} style={style} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
    return (
        <div className={cn('rounded-xl border border-[var(--color-neutral-100)] bg-white p-5 space-y-3', className)}>
            <SkeletonLine className="h-4 w-1/3" />
            <SkeletonLine className="h-8 w-1/2" />
            <SkeletonLine className="h-3 w-2/3" />
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white overflow-hidden">
            {/* Header */}
            <div className="flex gap-4 px-4 py-3 border-b border-[var(--color-neutral-100)] bg-[var(--color-neutral-50)]">
                {Array.from({ length: cols }).map((_, i) => (
                    <SkeletonLine key={i} className="h-3 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div
                    key={r}
                    className="flex gap-4 px-4 py-3.5 border-b border-[var(--color-neutral-50)] last:border-0"
                >
                    {Array.from({ length: cols }).map((_, c) => (
                        <SkeletonLine
                            key={c}
                            className={cn('h-3 flex-1', c === 0 ? 'max-w-[120px]' : '')}
                            style={{ opacity: 1 - r * 0.1 } as React.CSSProperties}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-5 animate-pulse">
            {/* Top cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
            {/* Filing stepper */}
            <div className="rounded-xl border border-[var(--color-neutral-100)] bg-white p-5 space-y-4">
                <SkeletonLine className="h-4 w-1/4" />
                <div className="flex gap-3 overflow-hidden">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <SkeletonLine className="w-8 h-8 rounded-full" />
                            <SkeletonLine className="h-2 w-14" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Two col */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SkeletonCard className="h-40" />
                <SkeletonCard className="h-40" />
            </div>
        </div>
    );
}
