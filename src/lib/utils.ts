import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, differenceInCalendarDays, format } from 'date-fns';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Format a number as Bangladeshi Taka: ৳ + comma-separated */
export function formatBDT(amount: number): string {
    return `৳${amount.toLocaleString('en-BD')}`;
}

/** Mask all but the last N characters with bullets */
export function maskSensitive(value: string, showLast = 4): string {
    if (!value) return '';
    if (value.length <= showLast) return value;
    return '•'.repeat(value.length - showLast) + value.slice(-showLast);
}

/** "2 hours ago" */
export function timeAgo(date: string | Date): string {
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
        return '—';
    }
}

/** Format date, default "15 Feb 2026" */
export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
    try {
        return format(new Date(date), fmt);
    } catch {
        return '—';
    }
}

/** Format date + time, e.g. "15 Feb 2026, 02:30 PM" */
export function formatDateTime(date: string | Date): string {
    try {
        return format(new Date(date), 'dd MMM yyyy, hh:mm a');
    } catch {
        return '—';
    }
}

/** Returns a Tailwind text-color class based on days left until deadline */
export function deadlineColor(daysLeft: number): string {
    if (daysLeft < 0) return 'text-[var(--color-danger)]';
    if (daysLeft <= 3) return 'text-[var(--color-danger)]';
    if (daysLeft <= 14) return 'text-[var(--color-warning)]';
    return 'text-[var(--color-neutral-700)]';
}

/** Days remaining until a deadline date */
export function daysUntil(deadline: string | Date): number {
    return differenceInCalendarDays(new Date(deadline), new Date());
}

/** Extract a meaningful error message from an Axios error */
export function getApiError(err: unknown): string {
    const e = err as { response?: { data?: { message?: string | string[] } } };
    const raw = e?.response?.data?.message;
    if (!raw) return 'Something went wrong. Please try again.';
    if (Array.isArray(raw)) return raw[0];
    return raw;
}

/** Filing status → human-readable label */
export const FILING_STATUS_LABELS: Record<string, string> = {
    INITIATED: 'Initiated',
    DOCUMENTS_PENDING: 'Documents Pending',
    DOCUMENTS_RECEIVED: 'Documents Received',
    UNDER_PREPARATION: 'Under Preparation',
    REVIEW_READY: 'Ready for Review',
    CUSTOMER_APPROVED: 'Approved by You',
    E_FILED: 'Filed with NBR',
    ACKNOWLEDGED: 'Acknowledged',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
};

/** Ordered filing status steps for the progress stepper */
export const FILING_STEPS = [
    'INITIATED',
    'DOCUMENTS_PENDING',
    'DOCUMENTS_RECEIVED',
    'UNDER_PREPARATION',
    'REVIEW_READY',
    'CUSTOMER_APPROVED',
    'E_FILED',
    'ACKNOWLEDGED',
    'COMPLETED',
] as const;

export type FilingStatus = typeof FILING_STEPS[number];

/** Returns the 0-based index of the current status in the stepper */
export function filingStepIndex(status: string): number {
    const idx = FILING_STEPS.indexOf(status as FilingStatus);
    return idx === -1 ? 0 : idx;
}
