'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderOpen, FileText, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/lib/store/ui.store';

const BOTTOM_TABS = [
    { href: '/portal/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/portal/documents', label: 'Docs', icon: FolderOpen },
    { href: '/portal/filings', label: 'Filing', icon: FileText },
    { href: '/portal/payments', label: 'Pay', icon: CreditCard },
    { href: '/portal/profile', label: 'Me', icon: User },
];

export default function PortalBottomNav() {
    const pathname = usePathname();
    const unread = useUiStore((s) => s.unreadMessages);

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t
                 border-[var(--color-neutral-100)] safe-area-inset-bottom"
            role="navigation"
            aria-label="Primary navigation"
        >
            <ul className="flex">
                {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');

                    return (
                        <li key={href} className="flex-1">
                            <Link
                                href={href}
                                className="flex flex-col items-center gap-1 py-2.5 px-1 relative"
                            >
                                {/* unread badge for messages (merged under Docs tab here to keep 5 tabs) */}
                                {href === '/portal/documents' && unread > 0 && (
                                    <span
                                        className="absolute top-1.5 right-3 w-2 h-2 rounded-full"
                                        style={{ background: 'var(--color-danger)' }}
                                    />
                                )}
                                <Icon
                                    className={cn('w-5 h-5 transition-colors', active
                                        ? 'text-[var(--color-portal-primary)]'
                                        : 'text-[var(--color-neutral-400)]',
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span
                                    className={cn('text-[10px] font-medium transition-colors', active
                                        ? 'text-[var(--color-portal-primary)]'
                                        : 'text-[var(--color-neutral-400)]',
                                    )}
                                >
                                    {label}
                                </span>
                                {active && (
                                    <span
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                                        style={{ background: 'var(--color-portal-primary)' }}
                                    />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
