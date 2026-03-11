'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield, Users, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogin } from '@/lib/hooks/useAuth';

// ── Zod schemas ────────────────────────────────────────────────────────────

const emailSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});
type EmailForm = z.infer<typeof emailSchema>;

// ── OTP input helper ──────────────────────────────────────────────────────

function OtpBoxes({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);

    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[i] && i > 0) {
            refs.current[i - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
        if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
    };

    const handleChange = (i: number, raw: string) => {
        const digit = raw.replace(/\D/g, '').slice(-1);
        const next = [...value];
        next[i] = digit;
        onChange(next);
        if (digit && i < 5) refs.current[i + 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
        onChange([...digits, ...Array(6 - digits.length).fill('')]);
        refs.current[Math.min(digits.length, 5)]?.focus();
    };

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    value={value[i] ?? ''}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKey(i, e)}
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    className={cn(
                        'w-11 h-12 text-center text-lg font-semibold rounded-lg border-2 outline-none',
                        'bg-white transition-all duration-150',
                        'focus:border-[var(--color-portal-primary)] focus:ring-2 focus:ring-[var(--color-portal-primary)]/20',
                        value[i]
                            ? 'border-[var(--color-portal-primary)] text-[var(--color-portal-primary)]'
                            : 'border-[var(--color-neutral-200)] text-[var(--color-neutral-900)]',
                    )}
                />
            ))}
        </div>
    );
}

// ── Trust stat badge ──────────────────────────────────────────────────────

function TrustStat({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 text-white/80 text-sm">
            <span className="text-[var(--color-portal-secondary)]">{icon}</span>
            <span>{label}</span>
        </div>
    );
}

// ── Login page ────────────────────────────────────────────────────────────

export default function LoginPage() {
    const login = useLogin();
    const [tab, setTab] = useState<'email' | 'phone'>('email');
    const [showPw, setShowPw] = useState(false);
    const [shaking, setShaking] = useState(false);
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(Array(6).fill(''));

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

    const shake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
    };

    // Email/password login
    const onEmailSubmit = async (data: EmailForm) => {
        try {
            await login.mutateAsync(data);
        } catch {
            shake();
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">

            {/* ── Left panel — brand ──────────────────────────────────────────── */}
            <div
                className="hidden md:flex md:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
                style={{ background: 'var(--color-portal-primary)' }}
            >
                {/* Subtle dot-grid background */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-[0.04]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>

                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-semibold text-lg tracking-tight">
                            Anchor Point Advising
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                        Bangladesh's Most Trusted<br />Tax Filing Service
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Professional, accurate, and stress-free tax preparation<br />
                        for individuals, businesses, and NRBs.
                    </p>
                </div>

                {/* Trust stats */}
                <div className="relative z-10 space-y-3">
                    <TrustStat icon={<Users className="w-4 h-4" />} label="60+ Happy Clients" />
                    <TrustStat icon={<CheckCircle className="w-4 h-4" />} label="15+ Years of Experience" />
                    <TrustStat icon={<Shield className="w-4 h-4" />} label="100% Accurate Filings" />
                    <div className="pt-4 border-t border-white/10 text-white/40 text-xs">
                        Your data is secured with bank-grade AES-256 encryption.
                    </div>
                </div>
            </div>

            {/* ── Right panel — form ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-14 bg-white">

                {/* Mobile-only logo */}
                <div className="flex items-center gap-2 mb-8 md:hidden">
                    <Shield className="w-6 h-6 text-[var(--color-portal-primary)]" />
                    <span className="font-semibold text-[var(--color-portal-primary)]">
                        Anchor Point Advising
                    </span>
                </div>

                <div className="max-w-sm w-full mx-auto">
                    <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-1">
                        Welcome back
                    </h2>
                    <p className="text-[var(--color-neutral-500)] text-sm mb-7">
                        Sign in to your account to continue
                    </p>

                    {/* Tab switcher */}
                    <div
                        className="flex rounded-lg bg-[var(--color-neutral-100)] p-1 mb-6"
                        role="tablist"
                    >
                        {(['email', 'phone'] as const).map((t) => (
                            <button
                                key={t}
                                role="tab"
                                aria-selected={tab === t}
                                onClick={() => setTab(t)}
                                className={cn(
                                    'flex-1 py-2 text-sm font-medium rounded-md transition-all',
                                    tab === t
                                        ? 'bg-white text-[var(--color-portal-primary)] shadow-sm'
                                        : 'text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]',
                                )}
                            >
                                {t === 'email' ? 'Email' : 'Phone'}
                            </button>
                        ))}
                    </div>

                    {/* ── Email form ── */}
                    {tab === 'email' && (
                        <form
                            onSubmit={handleSubmit(onEmailSubmit)}
                            className={cn('space-y-4', shaking && 'animate-shake')}
                            noValidate
                        >
                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    {...register('email')}
                                    className={cn(
                                        'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-all',
                                        'text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]',
                                        'focus:ring-2 focus:ring-[var(--color-portal-primary)]/20 focus:border-[var(--color-portal-primary)]',
                                        errors.email
                                            ? 'border-[var(--color-danger)]'
                                            : 'border-[var(--color-neutral-200)]',
                                    )}
                                />
                                {errors.email && (
                                    <p className="text-[var(--color-danger)] text-xs mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-[var(--color-neutral-700)]"
                                    >
                                        Password
                                    </label>
                                    <Link
                                        href="/portal/forgot-password"
                                        className="text-xs text-[var(--color-portal-primary)] hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPw ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        {...register('password')}
                                        className={cn(
                                            'w-full h-10 px-3 pr-10 rounded-lg border text-sm outline-none transition-all',
                                            'text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]',
                                            'focus:ring-2 focus:ring-[var(--color-portal-primary)]/20 focus:border-[var(--color-portal-primary)]',
                                            errors.password
                                                ? 'border-[var(--color-danger)]'
                                                : 'border-[var(--color-neutral-200)]',
                                        )}
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPw ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPw((p) => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]
                               hover:text-[var(--color-neutral-700)] transition-colors"
                                    >
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-[var(--color-danger)] text-xs mt-1">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={login.isPending}
                                className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center
                           justify-center gap-2 transition-all active:scale-[0.98]
                           disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ background: 'var(--color-portal-primary)' }}
                            >
                                {login.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : null}
                                {login.isPending ? 'Signing in…' : 'Log In'}
                            </button>
                        </form>
                    )}

                    {/* ── Phone / OTP form ── */}
                    {tab === 'phone' && (
                        <div className="space-y-4">
                            {!otpSent ? (
                                <>
                                    <div>
                                        <label
                                            htmlFor="phone"
                                            className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5"
                                        >
                                            Phone number
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            placeholder="01712345678"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full h-10 px-3 rounded-lg border border-[var(--color-neutral-200)]
                                 text-sm outline-none transition-all text-[var(--color-neutral-900)]
                                 placeholder:text-[var(--color-neutral-400)]
                                 focus:ring-2 focus:ring-[var(--color-portal-primary)]/20
                                 focus:border-[var(--color-portal-primary)]"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setOtpSent(true)}
                                        disabled={phone.length < 11}
                                        className="w-full h-11 rounded-lg text-sm font-semibold text-white
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        style={{ background: 'var(--color-portal-primary)' }}
                                    >
                                        Send OTP
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-5">
                                    <p className="text-sm text-[var(--color-neutral-600)] text-center">
                                        Enter the 6-digit code sent to <strong>+88 {phone}</strong>
                                    </p>
                                    <OtpBoxes value={otp} onChange={setOtp} />
                                    <button
                                        disabled={otp.join('').length < 6}
                                        className="w-full h-11 rounded-lg text-sm font-semibold text-white
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        style={{ background: 'var(--color-portal-primary)' }}
                                    >
                                        Verify &amp; Log In
                                    </button>
                                    <p className="text-center text-xs text-[var(--color-neutral-500)]">
                                        Didn&apos;t receive it?{' '}
                                        <button
                                            className="text-[var(--color-portal-primary)] underline"
                                            onClick={() => setOtp(Array(6).fill(''))}
                                        >
                                            Resend OTP
                                        </button>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[var(--color-neutral-200)]" />
                        <span className="text-xs text-[var(--color-neutral-400)]">or</span>
                        <div className="flex-1 h-px bg-[var(--color-neutral-200)]" />
                    </div>

                    {/* Register link */}
                    <p className="text-center text-sm text-[var(--color-neutral-500)]">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/portal/register"
                            className="font-medium text-[var(--color-portal-primary)] hover:underline"
                        >
                            Register →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
