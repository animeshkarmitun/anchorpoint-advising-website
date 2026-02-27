'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRegister } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

// ── Schemas ─────────────────────────────────────────────────────────────────

const step1Schema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
});
const step2Schema = z.object({
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
const step3Schema = z.object({
    phone: z
        .string()
        .regex(/^01[3-9]\d{8}$/, 'Enter a valid BD number (01XXXXXXXXX)')
        .optional()
        .or(z.literal('')),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

// ── Password strength ────────────────────────────────────────────────────────

function strengthScore(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-4
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

function PasswordStrengthBar({ password }: { password: string }) {
    const score = strengthScore(password);
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            'h-1 flex-1 rounded-full transition-all duration-300',
                            i <= score ? STRENGTH_COLORS[score] : 'bg-[var(--color-neutral-200)]',
                        )}
                    />
                ))}
            </div>
            <p className={cn('text-xs', score >= 3 ? 'text-green-600' : 'text-[var(--color-neutral-500)]')}>
                {STRENGTH_LABELS[score]}
            </p>
        </div>
    );
}

// ── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'rounded-full transition-all duration-300',
                        i < current
                            ? 'w-6 h-2 bg-[var(--color-portal-primary)]'
                            : i === current
                                ? 'w-6 h-2 bg-[var(--color-portal-primary)]'
                                : 'w-2 h-2 bg-[var(--color-neutral-200)]',
                    )}
                />
            ))}
            <span className="ml-1 text-xs text-[var(--color-neutral-400)]">
                Step {current + 1} of {total}
            </span>
        </div>
    );
}

// ── Field ────────────────────────────────────────────────────────────────────

function Field({
    label, id, error, children,
}: { label: string; id: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="text-[var(--color-danger)] text-xs mt-1">{error}</p>}
        </div>
    );
}

const inputCls = (hasError?: boolean) =>
    cn(
        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-all',
        'text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]',
        'focus:ring-2 focus:ring-[var(--color-portal-primary)]/20 focus:border-[var(--color-portal-primary)]',
        hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-neutral-200)]',
    );

const primaryBtn =
    'w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
    const [step, setStep] = useState(0);
    const [showPw, setShowPw] = useState(false);
    const [showCp, setShowCp] = useState(false);
    const register = useRegister();
    const router = useRouter();

    // Accumulated form data across steps
    const [accum, setAccum] = useState({ fullName: '', email: '', password: '', phone: '' });

    const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) });
    const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema) });
    const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

    const pw = form2.watch('password', '');

    const onStep1 = (d: Step1) => {
        setAccum((p) => ({ ...p, ...d }));
        setStep(1);
    };

    const onStep2 = (d: Step2) => {
        setAccum((p) => ({ ...p, password: d.password }));
        setStep(2);
    };

    const onStep3 = async (d: Step3) => {
        const payload = { ...accum, phone: d.phone || undefined };
        try {
            await register.mutateAsync(payload);
            router.push('/portal/onboarding');
        } catch {
            // error is shown via toast in the hook
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">

            {/* ── Left brand panel ───────────────────────────────────────────── */}
            <div
                className="hidden md:flex md:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
                style={{ background: 'var(--color-portal-primary)' }}
            >
                <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-semibold text-lg">Anchor Point Advising</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                        Your taxes, handled<br />professionally.
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Create your secure account in under 2 minutes<br />
                        and let us handle the rest.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    {[
                        'Free registration — no upfront cost',
                        'Secure document upload & tracking',
                        'Direct communication with your tax advisor',
                        'Bangla & English interface',
                    ].map((f) => (
                        <div key={f} className="flex items-center gap-2.5 text-white/80 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-[var(--color-portal-secondary)] flex-shrink-0" />
                            {f}
                        </div>
                    ))}
                    <div className="pt-4 border-t border-white/10 text-white/40 text-xs">
                        Your data is secured with bank-grade AES-256 encryption.
                    </div>
                </div>
            </div>

            {/* ── Right form panel ───────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-14 bg-white">

                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-8 md:hidden">
                    <Shield className="w-6 h-6 text-[var(--color-portal-primary)]" />
                    <span className="font-semibold text-[var(--color-portal-primary)]">Anchor Point Advising</span>
                </div>

                <div className="max-w-sm w-full mx-auto">

                    {/* Back button */}
                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="flex items-center gap-1.5 text-sm text-[var(--color-neutral-500)]
                         hover:text-[var(--color-neutral-800)] mb-5 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-1">
                        {step === 0 ? 'Create your account' : step === 1 ? 'Secure your account' : 'Almost done!'}
                    </h2>
                    <p className="text-[var(--color-neutral-500)] text-sm mb-6">
                        {step === 0
                            ? 'Let\'s start with the basics'
                            : step === 1
                                ? 'Choose a strong password'
                                : 'Add your phone for important updates (optional)'}
                    </p>

                    <StepDots current={step} total={3} />

                    {/* ── STEP 0: Name + Email ── */}
                    {step === 0 && (
                        <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4 animate-fade-in" noValidate>
                            <Field label="Full Name" id="fullName" error={form1.formState.errors.fullName?.message}>
                                <input
                                    id="fullName"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Rahul Ahmed"
                                    {...form1.register('fullName')}
                                    className={inputCls(!!form1.formState.errors.fullName)}
                                    autoFocus
                                />
                            </Field>
                            <Field label="Email address" id="email" error={form1.formState.errors.email?.message}>
                                <input
                                    id="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    {...form1.register('email')}
                                    className={inputCls(!!form1.formState.errors.email)}
                                />
                            </Field>
                            <button
                                type="submit"
                                className={primaryBtn}
                                style={{ background: 'var(--color-portal-primary)' }}
                            >
                                Continue →
                            </button>
                        </form>
                    )}

                    {/* ── STEP 1: Password ── */}
                    {step === 1 && (
                        <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4 animate-fade-in" noValidate>
                            <Field label="Password" id="password" error={form2.formState.errors.password?.message}>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPw ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Min. 8 characters"
                                        {...form2.register('password')}
                                        className={inputCls(!!form2.formState.errors.password) + ' pr-10'}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((p) => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]"
                                    >
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <PasswordStrengthBar password={pw} />
                            </Field>

                            <Field label="Confirm Password" id="confirmPassword" error={form2.formState.errors.confirmPassword?.message}>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showCp ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        placeholder="Repeat password"
                                        {...form2.register('confirmPassword')}
                                        className={inputCls(!!form2.formState.errors.confirmPassword) + ' pr-10'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCp((p) => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]"
                                    >
                                        {showCp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </Field>

                            <button
                                type="submit"
                                className={primaryBtn}
                                style={{ background: 'var(--color-portal-primary)' }}
                            >
                                Continue →
                            </button>
                        </form>
                    )}

                    {/* ── STEP 2: Phone (optional) ── */}
                    {step === 2 && (
                        <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4 animate-fade-in" noValidate>
                            <Field label="Phone number (optional)" id="phone" error={form3.formState.errors.phone?.message}>
                                <input
                                    id="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="01712345678"
                                    {...form3.register('phone')}
                                    className={inputCls(!!form3.formState.errors.phone)}
                                    autoFocus
                                />
                                <p className="text-xs text-[var(--color-neutral-400)] mt-1">
                                    Used for OTP login and important filing updates. Never shared.
                                </p>
                            </Field>

                            <button
                                type="submit"
                                disabled={register.isPending}
                                className={primaryBtn}
                                style={{ background: 'var(--color-portal-primary)' }}
                            >
                                {register.isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                                    : 'Create Account'}
                            </button>

                            <button
                                type="button"
                                onClick={() => form3.handleSubmit(onStep3)({ phone: '' })}
                                className="w-full text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)] py-2 transition-colors"
                            >
                                Skip for now
                            </button>
                        </form>
                    )}

                    {/* Login link */}
                    <p className="text-center text-sm text-[var(--color-neutral-500)] mt-6">
                        Already have an account?{' '}
                        <Link href="/portal/login" className="font-medium text-[var(--color-portal-primary)] hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
