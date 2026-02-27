'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Eye, EyeOff, Loader2, ShieldCheck, Lock,
    BarChart3, Users, FileStack,
} from 'lucide-react';
import { cn, getApiError } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';
import { authApi } from '@/lib/api/auth.api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
    totp: z.string().length(6, '6-digit code required').optional().or(z.literal('')),
});
type Form = z.infer<typeof schema>;

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <span className="text-white/75 text-sm">{text}</span>
        </div>
    );
}

export default function AdminLoginPage() {
    const [showPw, setShowPw] = useState(false);
    const [step, setStep] = useState<'credentials' | 'totp'>('credentials');
    const [shaking, setShaking] = useState(false);
    const [totpDigits, setTotpDigits] = useState(Array(6).fill(''));
    const totpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const setAuth = useAuthStore((s) => s.setAuth);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, getValues, formState: { errors } } = useForm<Form>({
        resolver: zodResolver(schema),
    });

    const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 500); };

    const onCredentials = async (data: Form) => {
        setLoading(true);
        try {
            const res = await authApi.login({ email: data.email, password: data.password });

            // Block customers from accessing admin
            if (res.user.role === 'CUSTOMER') {
                toast.error('This portal is for staff only. Please use the customer portal.');
                shake();
                return;
            }

            // If user has 2FA enabled, show the TOTP step
            // (backend returns 2FA challenge indicator — for now skip to dashboard)
            setAuth(res.accessToken, res.user);
            toast.success(`Welcome, ${res.user.name.split(' ')[0]}!`);
            router.push('/admin/dashboard');
        } catch (err) {
            toast.error(getApiError(err));
            shake();
        } finally {
            setLoading(false);
        }
    };

    const handleTotpInput = (i: number, raw: string) => {
        const digit = raw.replace(/\D/g, '').slice(-1);
        const next = [...totpDigits];
        next[i] = digit;
        setTotpDigits(next);
        if (digit && i < 5) totpRefs.current[i + 1]?.focus();
    };

    const handleTotpKey = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !totpDigits[i] && i > 0) totpRefs.current[i - 1]?.focus();
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">

            {/* ── Left brand pane ─────────────────────────────────────────────── */}
            <div
                className="hidden md:flex md:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
                style={{ background: 'var(--color-admin-bg)' }}
            >
                <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                            <path d="M32 0 L0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold">Anchor Point</p>
                            <p className="text-white/40 text-xs -mt-0.5">Admin Panel</p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white leading-snug mb-2">
                        Staff Operations Centre
                    </h1>
                    <p className="text-white/50 text-sm leading-relaxed">
                        Secure access for authorised staff only.
                    </p>
                </div>

                <div className="relative z-10 space-y-3">
                    <Feature
                        icon={<BarChart3 className="w-4 h-4 text-indigo-300" />}
                        text="Real-time analytics and reporting"
                    />
                    <Feature
                        icon={<Users className="w-4 h-4 text-indigo-300" />}
                        text="Customer management and support"
                    />
                    <Feature
                        icon={<FileStack className="w-4 h-4 text-indigo-300" />}
                        text="Document review and approval"
                    />
                    <div className="pt-4 border-t border-white/10 text-white/30 text-xs flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Secured session — auto-expires after 10 minutes of inactivity
                    </div>
                </div>
            </div>

            {/* ── Right form pane ─────────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--color-neutral-50)]">
                <div className="w-full max-w-sm">

                    {/* Mobile header */}
                    <div className="flex items-center gap-2 mb-8 md:hidden">
                        <ShieldCheck className="w-6 h-6 text-indigo-900" />
                        <span className="font-semibold text-indigo-900">Admin Panel</span>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-neutral-100)] p-7">
                        {step === 'credentials' ? (
                            <>
                                <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-1">Staff Login</h2>
                                <p className="text-sm text-[var(--color-neutral-500)] mb-6">Enter your staff credentials</p>

                                <form
                                    onSubmit={handleSubmit(onCredentials)}
                                    className={cn('space-y-4', shaking && 'animate-shake')}
                                    noValidate
                                >
                                    {/* Email */}
                                    <div>
                                        <label htmlFor="adm-email" className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            id="adm-email"
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            placeholder="staff@anchorpoint.com"
                                            {...register('email')}
                                            className={cn(
                                                'w-full h-10 px-3 rounded-lg border text-sm outline-none transition-all',
                                                'text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]',
                                                'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                                errors.email ? 'border-[var(--color-danger)]' : 'border-[var(--color-neutral-200)]',
                                            )}
                                        />
                                        {errors.email && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.email.message}</p>}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label htmlFor="adm-password" className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="adm-password"
                                                type={showPw ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                {...register('password')}
                                                className={cn(
                                                    'w-full h-10 px-3 pr-10 rounded-lg border text-sm outline-none transition-all',
                                                    'text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)]',
                                                    'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                                    errors.password ? 'border-[var(--color-danger)]' : 'border-[var(--color-neutral-200)]',
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw((p) => !p)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-neutral-400)]"
                                            >
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.password.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center
                               justify-center gap-2 transition-all active:scale-[0.98]
                               disabled:opacity-60 bg-indigo-900 hover:bg-indigo-800"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {loading ? 'Signing in…' : 'Log In'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* TOTP step */
                            <>
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-indigo-700" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-[var(--color-neutral-900)]">2-Factor Verification</h2>
                                        <p className="text-xs text-[var(--color-neutral-500)]">Open your authenticator app</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-center mb-5">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { totpRefs.current[i] = el; }}
                                            value={totpDigits[i]}
                                            onChange={(e) => handleTotpInput(i, e.target.value)}
                                            onKeyDown={(e) => handleTotpKey(i, e)}
                                            inputMode="numeric"
                                            autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                            maxLength={1}
                                            className="w-10 h-12 text-center text-lg font-semibold rounded-lg border-2 outline-none
                                 border-[var(--color-neutral-200)] focus:border-indigo-500 transition-all"
                                        />
                                    ))}
                                </div>

                                <button
                                    disabled={totpDigits.join('').length < 6 || loading}
                                    onClick={async () => {
                                        const code = totpDigits.join('');
                                        // TODO: call TOTP verify endpoint
                                        toast.info('TOTP verification coming soon');
                                    }}
                                    className="w-full h-11 rounded-lg text-sm font-semibold text-white bg-indigo-900
                             hover:bg-indigo-800 disabled:opacity-50 transition-all"
                                >
                                    Verify Code
                                </button>

                                <button
                                    onClick={() => setStep('credentials')}
                                    className="w-full mt-2 text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)] py-2"
                                >
                                    ← Back
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-center text-xs text-[var(--color-neutral-400)] mt-5">
                        Customer?{' '}
                        <a href="/portal/login" className="text-[var(--color-portal-primary)] hover:underline">
                            Use the customer portal
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
