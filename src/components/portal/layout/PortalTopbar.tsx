'use client';

import { Globe } from 'lucide-react';
import { useUiStore } from '@/lib/store/ui.store';
import NotificationBell from '@/components/shared/NotificationBell';

interface PortalTopbarProps {
    title?: string;
}

export default function PortalTopbar({ title }: PortalTopbarProps) {
    const { language, setLanguage } = useUiStore();

    return (
        <header
            className="fixed top-0 right-0 left-0 lg:left-[var(--portal-sidebar-w)] z-20
                 h-[var(--topbar-h)] bg-white border-b border-[var(--color-neutral-100)]
                 flex items-center justify-between px-4 lg:px-6"
        >
            {/* Mobile logo / Desktop page title */}
            <div className="flex items-center gap-2.5">
                <div
                    className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-portal-primary)' }}
                >
                    <span className="text-white font-bold text-sm">AP</span>
                </div>
                {title && (
                    <h1 className="hidden lg:block font-semibold text-[var(--color-neutral-900)] text-base">
                        {title}
                    </h1>
                )}
            </div>

            <div className="flex items-center gap-1">
                {/* Language toggle */}
                <button
                    onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                     text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] transition-all"
                    aria-label="Switch language"
                >
                    <Globe className="w-3.5 h-3.5" />
                    {language === 'en' ? 'বাংলা' : 'EN'}
                </button>

                {/* Notification bell + dropdown */}
                <NotificationBell />
            </div>
        </header>
    );
}

