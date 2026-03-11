'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Shield, Loader2, CheckCircle2, ArrowRight, ArrowLeft,
    Briefcase, User, Users, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';
import apiClient from '@/lib/api/client';

// ── Types ────────────────────────────────────────────────────────────────────

type TaxpayerCategory = 'INDIVIDUAL' | 'COMPANY' | 'PARTNERSHIP' | 'OTHER';
type IncomeSource = 'SALARY' | 'BUSINESS' | 'FREELANCE' | 'RENTAL' | 'INVESTMENT' | 'OTHER';

interface OnboardingData {
    taxpayerCategory: TaxpayerCategory;
    incomeSources: IncomeSource[];
    tin?: string;
    nid?: string;
    language: 'en' | 'bn';
}

// ── Category options ─────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: TaxpayerCategory; label: string; desc: string; icon: React.ReactNode }[] = [
    {
        value: 'INDIVIDUAL',
        label: 'Individual',
        desc: 'Salaried employee or personal income',
        icon: <User className="w-5 h-5" />,
    },
    {
        value: 'COMPANY',
        label: 'Business Owner',
        desc: 'Company or proprietorship',
        icon: <Building2 className="w-5 h-5" />,
    },
    {
        value: 'PARTNERSHIP',
        label: 'Partnership',
        desc: 'Joint business or firm',
        icon: <Users className="w-5 h-5" />,
    },
    {
        value: 'OTHER',
        label: 'Other / NRB',
        desc: 'Non-resident or special category',
        icon: <Briefcase className="w-5 h-5" />,
    },
];

const INCOME_OPTIONS: { value: IncomeSource; label: string; emoji: string }[] = [
    { value: 'SALARY', label: 'Salary / Wages', emoji: '💼' },
    { value: 'BUSINESS', label: 'Business Income', emoji: '🏪' },
    { value: 'FREELANCE', label: 'Freelance / Consulting', emoji: '💻' },
    { value: 'RENTAL', label: 'Rental Income', emoji: '🏠' },
    { value: 'INVESTMENT', label: 'Investment / Dividends', emoji: '📈' },
    { value: 'OTHER', label: 'Other', emoji: '📋' },
];

// ── Step indicator ───────────────────────────────────────────────────────────

function StepProgress({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'rounded-full transition-all duration-300',
                        i <= current
                            ? 'w-8 h-2 bg-[var(--color-portal-primary)]'
                            : 'w-2 h-2 bg-[var(--color-neutral-200)]',
                    )}
                />
            ))}
            <span className="ml-2 text-xs text-[var(--color-neutral-400)]">
                Step {current + 1} of {total}
            </span>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        taxpayerCategory: 'INDIVIDUAL',
        incomeSources: [],
        tin: '',
        nid: '',
        language: 'en',
    });

    const totalSteps = 3;

    const toggleIncome = (src: IncomeSource) => {
        setData((d) => ({
            ...d,
            incomeSources: d.incomeSources.includes(src)
                ? d.incomeSources.filter((s) => s !== src)
                : [...d.incomeSources, src],
        }));
    };

    const canProceed = () => {
        if (step === 0) return true; // category always has default
        if (step === 1) return data.incomeSources.length > 0;
        return true; // step 2 is optional
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await apiClient.put('/profile', {
                taxpayerCategory: data.taxpayerCategory,
                incomeSources: data.incomeSources,
                tin: data.tin || undefined,
                nid: data.nid || undefined,
                language: data.language,
                onboardingDone: true,
            });

            // Update local state
            if (user) {
                setUser({ ...user, onboardingDone: true, language: data.language });
            }

            toast.success('Welcome aboard! Your profile is set up.');
            router.push('/portal/dashboard');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep((s) => s + 1);
        } else {
            handleSubmit();
        }
    };

    const inputCls =
        'w-full h-10 px-3 rounded-lg border border-[var(--color-neutral-200)] text-sm outline-none transition-all text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus:ring-2 focus:ring-[var(--color-portal-primary)]/20 focus:border-[var(--color-portal-primary)]';

    return (
        <div className="min-h-screen flex flex-col md:flex-row">

            {/* ── Left brand panel ────────────────────────────────── */}
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
                        Let&apos;s set up<br />your profile
                    </h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        This helps us tailor your experience and<br />
                        prepare your tax filing accurately.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    {[
                        'Takes less than 2 minutes',
                        'You can update this anytime',
                        'Your information is encrypted',
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

            {/* ── Right content panel ─────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-14 bg-white">

                {/* Mobile logo */}
                <div className="flex items-center gap-2 mb-8 md:hidden">
                    <Shield className="w-6 h-6 text-[var(--color-portal-primary)]" />
                    <span className="font-semibold text-[var(--color-portal-primary)]">Anchor Point Advising</span>
                </div>

                <div className="max-w-md w-full mx-auto">

                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => s - 1)}
                            className="flex items-center gap-1.5 text-sm text-[var(--color-neutral-500)]
                             hover:text-[var(--color-neutral-800)] mb-5 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    )}

                    <StepProgress current={step} total={totalSteps} />

                    {/* ── STEP 0: Taxpayer Category ── */}
                    {step === 0 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-1">
                                What type of taxpayer are you?
                            </h2>
                            <p className="text-[var(--color-neutral-500)] text-sm mb-6">
                                This helps us decide which forms and deductions apply to you.
                            </p>

                            <div className="grid gap-3">
                                {CATEGORY_OPTIONS.map((opt) => {
                                    const selected = data.taxpayerCategory === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => setData((d) => ({ ...d, taxpayerCategory: opt.value }))}
                                            className={cn(
                                                'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                                                selected
                                                    ? 'border-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/5'
                                                    : 'border-[var(--color-neutral-100)] hover:border-[var(--color-neutral-300)]',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                                                    selected
                                                        ? 'bg-[var(--color-portal-primary)] text-white'
                                                        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]',
                                                )}
                                            >
                                                {opt.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    'text-sm font-semibold',
                                                    selected ? 'text-[var(--color-portal-primary)]' : 'text-[var(--color-neutral-900)]',
                                                )}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-xs text-[var(--color-neutral-500)] mt-0.5">
                                                    {opt.desc}
                                                </p>
                                            </div>
                                            {selected && (
                                                <CheckCircle2 className="w-5 h-5 text-[var(--color-portal-primary)] flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Income Sources ── */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-1">
                                Where does your income come from?
                            </h2>
                            <p className="text-[var(--color-neutral-500)] text-sm mb-6">
                                Select all that apply. This helps us identify required documents.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {INCOME_OPTIONS.map((opt) => {
                                    const selected = data.incomeSources.includes(opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => toggleIncome(opt.value)}
                                            className={cn(
                                                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                                                selected
                                                    ? 'border-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/5'
                                                    : 'border-[var(--color-neutral-100)] hover:border-[var(--color-neutral-300)]',
                                            )}
                                        >
                                            <span className="text-2xl">{opt.emoji}</span>
                                            <span className={cn(
                                                'text-xs font-medium text-center leading-tight',
                                                selected ? 'text-[var(--color-portal-primary)]' : 'text-[var(--color-neutral-700)]',
                                            )}>
                                                {opt.label}
                                            </span>
                                            {selected && (
                                                <CheckCircle2 className="w-4 h-4 text-[var(--color-portal-primary)]" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {data.incomeSources.length === 0 && (
                                <p className="text-xs text-[var(--color-neutral-400)] mt-3 text-center">
                                    Please select at least one income source
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: TIN / NID (optional) ── */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold text-[var(--color-neutral-900)] mb-1">
                                Tax details (optional)
                            </h2>
                            <p className="text-[var(--color-neutral-500)] text-sm mb-6">
                                You can add these later from your profile. They help speed up your filing.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="tin"
                                        className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5"
                                    >
                                        TIN (Tax Identification Number)
                                    </label>
                                    <input
                                        id="tin"
                                        type="text"
                                        placeholder="e.g. 123456789012"
                                        value={data.tin}
                                        onChange={(e) => setData((d) => ({ ...d, tin: e.target.value }))}
                                        className={inputCls}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="nid"
                                        className="block text-sm font-medium text-[var(--color-neutral-700)] mb-1.5"
                                    >
                                        NID (National ID)
                                    </label>
                                    <input
                                        id="nid"
                                        type="text"
                                        placeholder="e.g. 1234567890123"
                                        value={data.nid}
                                        onChange={(e) => setData((d) => ({ ...d, nid: e.target.value }))}
                                        className={inputCls}
                                    />
                                </div>

                                {/* Language preference */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-neutral-700)] mb-2">
                                        Preferred language
                                    </label>
                                    <div className="flex gap-3">
                                        {([
                                            { value: 'en', label: '🇬🇧 English' },
                                            { value: 'bn', label: '🇧🇩 বাংলা' },
                                        ] as const).map((lang) => (
                                            <button
                                                key={lang.value}
                                                onClick={() => setData((d) => ({ ...d, language: lang.value }))}
                                                className={cn(
                                                    'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all',
                                                    data.language === lang.value
                                                        ? 'border-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/5 text-[var(--color-portal-primary)]'
                                                        : 'border-[var(--color-neutral-100)] text-[var(--color-neutral-600)] hover:border-[var(--color-neutral-300)]',
                                                )}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className="mt-8 space-y-3">
                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || submitting}
                            className="w-full h-11 rounded-lg text-sm font-semibold text-white flex items-center
                               justify-center gap-2 transition-all active:scale-[0.98]
                               disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--color-portal-primary)' }}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Setting up…
                                </>
                            ) : step < totalSteps - 1 ? (
                                <>
                                    Continue <ArrowRight className="w-4 h-4" />
                                </>
                            ) : (
                                'Complete Setup'
                            )}
                        </button>

                        {step === totalSteps - 1 && (
                            <button
                                onClick={() => {
                                    setData((d) => ({ ...d, tin: '', nid: '' }));
                                    handleSubmit();
                                }}
                                disabled={submitting}
                                className="w-full text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-800)]
                                   py-2 transition-colors"
                            >
                                Skip — I&apos;ll add these later
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
