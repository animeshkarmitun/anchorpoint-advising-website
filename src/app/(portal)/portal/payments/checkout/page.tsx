'use client';

import { useState, Suspense } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    CreditCard, Smartphone, Building2,
    ChevronLeft, Loader2, Shield, Tag,
} from 'lucide-react';
import { cn, formatBDT, getApiError } from '@/lib/utils';
import { paymentsApi, type PaymentMethod } from '@/lib/api/payments.api';
import { toast } from 'sonner';

// ── Payment method options ────────────────────────────────────────────────────

const METHODS: { key: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'BKASH',         label: 'bKash',        icon: <Smartphone className="w-5 h-5" />, color: '#E2136E' },
    { key: 'NAGAD',         label: 'Nagad',         icon: <Smartphone className="w-5 h-5" />, color: '#F6921E' },
    { key: 'ROCKET',        label: 'Rocket',        icon: <Smartphone className="w-5 h-5" />, color: '#8C3494' },
    { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <Building2  className="w-5 h-5" />, color: '#1B3A6B' },
    { key: 'CARD',          label: 'Credit/Debit',  icon: <CreditCard className="w-5 h-5" />, color: '#4F46E5' },
];

// ── Checkout form component ───────────────────────────────────────────────────

function CheckoutForm() {
    const router = useRouter();
    const params = useSearchParams();

    const filingId       = params.get('filingId')       ?? '';
    const consultationId = params.get('consultationId') ?? '';
    const amountParam    = params.get('amount');
    const serviceLabel   = params.get('service')        ?? 'Service';

    const baseAmount = amountParam ? parseInt(amountParam, 10) : 0;

    const [method, setMethod]   = useState<PaymentMethod | ''>('');
    const [coupon, setCoupon]   = useState('');
    const [discount, setDiscount] = useState(0);

    const finalAmount = Math.max(0, baseAmount - discount);

    const pay = useMutation({
        mutationFn: () => paymentsApi.initiate({
            ...(filingId && { filingId }),
            ...(consultationId && { consultationId }),
            amount: baseAmount,
            method: method as PaymentMethod,
            ...(coupon && { couponCode: coupon }),
        }),
        onSuccess: () => {
            toast.success('Payment initiated successfully!');
            router.replace('/portal/payments');
        },
        onError: (err) => toast.error(getApiError(err)),
    });

    if (!baseAmount) {
        return (
            <div className="text-center py-16">
                <p className="text-sm text-[var(--color-neutral-500)]">Invalid checkout link.</p>
                <button onClick={() => router.back()} className="mt-3 text-sm text-indigo-600 hover:underline">← Go back</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Back + header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-[var(--color-neutral-200)]
                               hover:bg-[var(--color-neutral-50)] transition-all"
                >
                    <ChevronLeft className="w-4 h-4 text-[var(--color-neutral-600)]" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-neutral-900)]">Checkout</h1>
                    <p className="text-sm text-[var(--color-neutral-500)]">{serviceLabel}</p>
                </div>
            </div>

            {/* Summary card */}
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">Order Summary</h3>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-neutral-600)]">{serviceLabel}</span>
                    <span className="text-sm font-medium text-[var(--color-neutral-900)]">{formatBDT(baseAmount)}</span>
                </div>
                {discount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                        <span className="text-sm flex items-center gap-1"><Tag className="w-3 h-3" /> Discount</span>
                        <span className="text-sm font-medium">-{formatBDT(discount)}</span>
                    </div>
                )}
                <div className="border-t border-[var(--color-neutral-100)] pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--color-neutral-900)]">Total</span>
                    <span className="text-lg font-bold text-[var(--color-neutral-900)]">{formatBDT(finalAmount)}</span>
                </div>
            </div>

            {/* Coupon code */}
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-2">Promo Code</h3>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-neutral-400)]" />
                        <input
                            type="text"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                            placeholder="WELCOME20"
                            maxLength={20}
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-neutral-200)]
                                       text-sm uppercase tracking-wider placeholder:text-[var(--color-neutral-400)]
                                       focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => {
                            // Coupon validation would hit backend; for now simulate
                            if (coupon === 'WELCOME20') {
                                setDiscount(Math.round(baseAmount * 0.2));
                                toast.success('Coupon applied! 20% off');
                            } else if (coupon) {
                                toast.error('Invalid coupon code');
                            }
                        }}
                        disabled={!coupon}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-neutral-200)]
                                   text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-all
                                   disabled:opacity-40"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-xl border border-[var(--color-neutral-100)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-900)] mb-3">Payment Method</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {METHODS.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => setMethod(m.key)}
                            className={cn(
                                'flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all',
                                method === m.key
                                    ? 'border-2 shadow-sm'
                                    : 'border-[var(--color-neutral-200)] hover:border-[var(--color-neutral-300)]',
                            )}
                            style={method === m.key ? { borderColor: m.color, background: `${m.color}0A` } : {}}
                        >
                            <span style={{ color: m.color }}>{m.icon}</span>
                            <span className="text-sm font-medium text-[var(--color-neutral-800)]">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Pay button */}
            <button
                onClick={() => pay.mutate()}
                disabled={!method || pay.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                           text-sm font-bold text-white transition-all active:scale-[0.98]
                           disabled:opacity-50"
                style={{ background: 'var(--color-portal-primary)' }}
            >
                {pay.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Pay {formatBDT(finalAmount)}
            </button>

            <p className="text-center text-[10px] text-[var(--color-neutral-400)] flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Secured with SSL encryption
            </p>
        </div>
    );
}

// ── Page wrapper with Suspense (useSearchParams requires it) ──────────────────

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="skeleton h-8 w-40 rounded" />
                <div className="skeleton h-48 rounded-xl" />
                <div className="skeleton h-32 rounded-xl" />
            </div>
        }>
            <CheckoutForm />
        </Suspense>
    );
}
