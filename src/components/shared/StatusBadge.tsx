'use client';

import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<
    string,
    { label: string; labelBn?: string; bg: string; text: string; dot: string }
> = {
    // Filing statuses
    INITIATED: { label: 'Initiated', bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
    DOCUMENTS_PENDING: { label: 'Docs Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    DOCUMENTS_RECEIVED: { label: 'Docs Received', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    UNDER_PREPARATION: { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-400' },
    REVIEW_READY: { label: 'Ready for Review', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    CUSTOMER_APPROVED: { label: 'Approved by You', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    E_FILED: { label: 'Filed with NBR', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    ACKNOWLEDGED: { label: 'Acknowledged', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    COMPLETED: { label: 'Completed ✓', bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-600' },
    ON_HOLD: { label: 'On Hold', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },

    // Document statuses
    PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    REJECTED: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    NEEDS_REUPLOAD: { label: 'Re-upload Needed', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
    NOT_UPLOADED: { label: 'Not Uploaded', bg: 'bg-neutral-100', text: 'text-neutral-500', dot: 'bg-neutral-300' },

    // Payment statuses
    PAID: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    UNPAID: { label: 'Unpaid', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    PROCESSING: { label: 'Processing', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
    REFUNDED: { label: 'Refunded', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400' },

    // User statuses
    ACTIVE: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    INACTIVE: { label: 'Inactive', bg: 'bg-neutral-100', text: 'text-neutral-500', dot: 'bg-neutral-400' },
    SUSPENDED: { label: 'Suspended', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
    showDot?: boolean;
    className?: string;
}

export default function StatusBadge({
    status,
    size = 'sm',
    showDot = true,
    className,
}: StatusBadgeProps) {
    const cfg = STATUS_CONFIG[status] ?? {
        label: status.replace(/_/g, ' '),
        bg: 'bg-neutral-100',
        text: 'text-neutral-600',
        dot: 'bg-neutral-400',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-medium rounded-full',
                size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1',
                cfg.bg,
                cfg.text,
                className,
            )}
        >
            {showDot && (
                <span className={cn('rounded-full flex-shrink-0', cfg.dot,
                    size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
            )}
            {cfg.label}
        </span>
    );
}
