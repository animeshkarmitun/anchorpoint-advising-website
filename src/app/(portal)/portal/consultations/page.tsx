'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CalendarDays, Clock, Video, Phone as PhoneIcon, MapPin,
    ChevronLeft, ChevronRight, Loader2,
    ExternalLink,
} from 'lucide-react';
import { cn, formatDate, getApiError } from '@/lib/utils';
import { consultationsApi, type Consultation, type ConsultationMedium, type TimeSlot } from '@/lib/api/consultations.api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { SkeletonCard } from '@/components/shared/Skeletons';
import { toast } from 'sonner';

// ── Status config for consultations ────────────────────────────────────────────

const MEDIUM_ICONS: Record<ConsultationMedium, React.ReactNode> = {
    VIDEO: <Video className="w-4 h-4" />,
    PHONE: <PhoneIcon className="w-4 h-4" />,
    IN_PERSON: <MapPin className="w-4 h-4" />,
};

const MEDIUM_LABELS: Record<ConsultationMedium, string> = {
    VIDEO: 'Video Call',
    PHONE: 'Phone Call',
    IN_PERSON: 'In Person',
};

// ── Calendar (date picker) ────────────────────────────────────────────────────

function MiniCalendar({
    selectedDate, onSelect,
}: {
    selectedDate: string;
    onSelect: (date: string) => void;
}) {
    const [monthOffset, setMonthOffset] = useState(0);
    const today = new Date();
    const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    const startDay = viewMonth.getDay(); // 0=Sun
    const todayStr = today.toISOString().split('T')[0];

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return (
        <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => setMonthOffset((o) => o - 1)}
                    disabled={monthOffset <= 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-neutral-400)]
                               hover:bg-[var(--color-neutral-50)] disabled:opacity-30 transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-[var(--color-neutral-900)]">{monthLabel}</span>
                <button
                    onClick={() => setMonthOffset((o) => o + 1)}
                    disabled={monthOffset >= 3}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-neutral-400)]
                               hover:bg-[var(--color-neutral-50)] disabled:opacity-30 transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <span key={i} className="text-center text-[10px] font-semibold text-[var(--color-neutral-400)] py-1">{d}</span>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((d, i) => {
                    if (d === null) return <span key={i} />;

                    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isPast = dateStr < todayStr;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === todayStr;

                    return (
                        <button
                            key={i}
                            onClick={() => !isPast && onSelect(dateStr)}
                            disabled={isPast}
                            className={cn(
                                'w-full aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center',
                                isPast && 'opacity-30 cursor-not-allowed',
                                isSelected && 'text-white',
                                isSelected && !isPast && 'bg-[var(--color-portal-primary)]',
                                !isSelected && isToday && 'border border-[var(--color-portal-primary)] text-[var(--color-portal-primary)]',
                                !isSelected && !isToday && !isPast && 'text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]',
                            )}
                        >
                            {d}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Time slot picker ──────────────────────────────────────────────────────────

function TimeSlotPicker({
    date, selectedSlot, onSelect,
}: {
    date: string;
    selectedSlot: string;
    onSelect: (time: string) => void;
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['consultation-slots', date],
        queryFn: () => consultationsApi.getSlots(date),
        enabled: !!date,
        staleTime: 60_000,
    });

    const slots: TimeSlot[] = data ?? [];

    if (!date) {
        return <p className="text-sm text-[var(--color-neutral-400)] text-center py-6">Select a date first</p>;
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
            </div>
        );
    }

    const availableSlots = slots.filter((s) => s.available);

    if (availableSlots.length === 0) {
        return <p className="text-sm text-[var(--color-neutral-500)] text-center py-6">No slots available for this date</p>;
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {availableSlots.map((slot) => {
                const time = new Date(slot.time);
                const label = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const isSelected = slot.time === selectedSlot;

                return (
                    <button
                        key={slot.time}
                        onClick={() => onSelect(slot.time)}
                        className={cn(
                            'px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                            isSelected
                                ? 'border-[var(--color-portal-primary)] bg-[var(--color-portal-primary)] text-white'
                                : 'border-[var(--color-neutral-200)] text-[var(--color-neutral-700)] hover:border-[var(--color-portal-primary)] hover:bg-blue-50',
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

// ── Booking form ──────────────────────────────────────────────────────────────

function BookingForm() {
    const queryClient = useQueryClient();
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');
    const [medium, setMedium] = useState<ConsultationMedium>('VIDEO');
    const [duration, setDuration] = useState(30);

    const book = useMutation({
        mutationFn: () => consultationsApi.book({ scheduledAt: slot, duration, medium }),
        onSuccess: () => {
            toast.success('Consultation booked!');
            queryClient.invalidateQueries({ queryKey: ['consultations'] });
            setDate('');
            setSlot('');
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    return (
        <div className="space-y-5">
            {/* Date + Slots side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calendar */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-2">Select Date</h3>
                    <MiniCalendar
                        selectedDate={date}
                        onSelect={(d) => { setDate(d); setSlot(''); }}
                    />
                </div>

                {/* Time slots */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-2">Available Times</h3>
                    <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-4">
                        <TimeSlotPicker date={date} selectedSlot={slot} onSelect={setSlot} />
                    </div>
                </div>
            </div>

            {/* Medium + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Medium */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-2">Meeting Type</h3>
                    <div className="flex gap-2">
                        {(['VIDEO', 'PHONE', 'IN_PERSON'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMedium(m)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                                    medium === m
                                        ? 'border-[var(--color-portal-primary)] bg-blue-50 text-[var(--color-portal-primary)]'
                                        : 'border-[var(--color-neutral-200)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]',
                                )}
                            >
                                {MEDIUM_ICONS[m]}
                                <span className="hidden sm:inline">{MEDIUM_LABELS[m]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-2">Duration</h3>
                    <div className="flex gap-2">
                        {[15, 30, 60].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDuration(d)}
                                className={cn(
                                    'flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all',
                                    duration === d
                                        ? 'border-[var(--color-portal-primary)] bg-blue-50 text-[var(--color-portal-primary)]'
                                        : 'border-[var(--color-neutral-200)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]',
                                )}
                            >
                                {d} min
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Book button */}
            <button
                onClick={() => book.mutate()}
                disabled={!slot || book.isPending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                           text-sm font-semibold text-white transition-all active:scale-[0.97]
                           disabled:opacity-50"
                style={{ background: 'var(--color-portal-primary)' }}
            >
                {book.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Book Consultation
            </button>
        </div>
    );
}

// ── Consultation card ─────────────────────────────────────────────────────────

function ConsultationCard({
    consultation, onCancel,
}: {
    consultation: Consultation;
    onCancel: (id: string) => void;
}) {
    const scheduled = new Date(consultation.scheduledAt);
    const isPast = scheduled < new Date();
    const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(consultation.status);

    return (
        <div className={cn(
            'bg-white rounded-xl border border-[var(--color-neutral-100)] p-4 transition-all',
            isUpcoming && !isPast && 'border-l-4 border-l-[var(--color-portal-primary)]',
        )}>
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        {MEDIUM_ICONS[consultation.medium]}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--color-neutral-900)]">
                            {MEDIUM_LABELS[consultation.medium]}
                        </p>
                        <p className="text-xs text-[var(--color-neutral-500)]">{consultation.duration} minutes</p>
                    </div>
                </div>
                <StatusBadge status={consultation.status} size="sm" />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-neutral-600)] mb-3">
                <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-[var(--color-neutral-400)]" />
                    {formatDate(consultation.scheduledAt)}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--color-neutral-400)]" />
                    {scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
                {consultation.advisor && (
                    <span className="text-xs text-[var(--color-neutral-500)]">
                        Advisor: <strong>{consultation.advisor.profile?.fullName ?? consultation.advisor.email}</strong>
                    </span>
                )}
            </div>

            {/* Meeting link for upcoming */}
            {isUpcoming && consultation.meetingLink && (
                <a
                    href={consultation.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700
                               text-xs font-medium hover:bg-green-100 transition-all mb-3"
                >
                    <ExternalLink className="w-3 h-3" /> Join Meeting
                </a>
            )}

            {/* Notes for completed */}
            {consultation.status === 'COMPLETED' && consultation.notes && (
                <div className="bg-[var(--color-neutral-50)] rounded-lg p-3 mb-3">
                    <p className="text-[10px] text-[var(--color-neutral-400)] uppercase font-semibold mb-1">Session Notes</p>
                    <p className="text-xs text-[var(--color-neutral-700)] leading-relaxed">{consultation.notes}</p>
                </div>
            )}

            {/* Actions */}
            {isUpcoming && !isPast && (
                <div className="flex gap-2">
                    <button
                        onClick={() => onCancel(consultation.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200
                                   text-red-600 hover:bg-red-50 transition-all"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConsultationsPage() {
    const [tab, setTab] = useState<'book' | 'upcoming' | 'past'>('book');
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    // Reset cancel reason when switching consultation
    useEffect(() => {
        if (cancelId) setCancelReason('');
    }, [cancelId]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['consultations'],
        queryFn: () => consultationsApi.list(),
        staleTime: 30_000,
    });

    const consultations: Consultation[] = Array.isArray(data) ? data : [];

    const upcoming = useMemo(() =>
        consultations.filter((c) =>
            ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(c.status) &&
            new Date(c.scheduledAt) >= new Date()
        ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
        [consultations],
    );

    const past = useMemo(() =>
        consultations.filter((c) =>
            ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(c.status) ||
            new Date(c.scheduledAt) < new Date()
        ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()),
        [consultations],
    );

    const cancelMut = useMutation({
        mutationFn: () => consultationsApi.cancel(cancelId!, cancelReason),
        onSuccess: () => {
            toast.success('Consultation cancelled');
            refetch();
            setCancelId(null);
            setCancelReason('');
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    const TABS = [
        { key: 'book' as const, label: 'Book', count: null },
        { key: 'upcoming' as const, label: 'Upcoming', count: upcoming.length || null },
        { key: 'past' as const, label: 'History', count: null },
    ];

    return (
        <div className="space-y-5">
            <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Consultations</h1>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[var(--color-neutral-100)]">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all',
                            tab === t.key
                                ? 'border-[var(--color-portal-primary)] text-[var(--color-portal-primary)]'
                                : 'border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]',
                        )}
                    >
                        {t.label}
                        {t.count && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'book' && <BookingForm />}

            {tab === 'upcoming' && (
                isLoading ? (
                    <div className="space-y-3">{[0, 1].map((i) => <SkeletonCard key={i} className="h-32" />)}</div>
                ) : upcoming.length === 0 ? (
                    <EmptyState
                        icon={<CalendarDays className="w-6 h-6 text-[var(--color-neutral-400)]" />}
                        title="No upcoming consultations"
                        description="Book a consultation to get started."
                        action={{ label: 'Book Now', onClick: () => setTab('book') }}
                    />
                ) : (
                    <div className="space-y-3">
                        {upcoming.map((c) => (
                            <ConsultationCard key={c.id} consultation={c} onCancel={() => setCancelId(c.id)} />
                        ))}
                    </div>
                )
            )}

            {tab === 'past' && (
                isLoading ? (
                    <div className="space-y-3">{[0, 1, 2].map((i) => <SkeletonCard key={i} className="h-32" />)}</div>
                ) : past.length === 0 ? (
                    <EmptyState title="No past consultations" description="Your consultation history will appear here." />
                ) : (
                    <div className="space-y-3">
                        {past.map((c) => (
                            <ConsultationCard key={c.id} consultation={c} onCancel={() => setCancelId(c.id)} />
                        ))}
                    </div>
                )
            )}

            {/* Cancel dialog */}
            {cancelId && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setCancelId(null)} />
                    <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                                   w-[90vw] max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4 animate-scale-in">
                        <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">Cancel Consultation</h3>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Reason for cancellation..."
                            rows={3}
                            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                       text-sm placeholder:text-[var(--color-neutral-400)]
                                       focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setCancelId(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                                           text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all">
                                Keep it
                            </button>
                            <button
                                onClick={() => cancelMut.mutate()}
                                disabled={!cancelReason.trim() || cancelMut.isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                                           text-white bg-[var(--color-danger)] hover:bg-red-700 transition-all
                                           active:scale-[0.97] disabled:opacity-50"
                            >
                                {cancelMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Cancel Consultation
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
