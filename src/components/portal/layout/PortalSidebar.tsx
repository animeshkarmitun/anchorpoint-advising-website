'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, FolderOpen, FileText, CreditCard,
    CalendarDays, MessageSquare, LifeBuoy, LogOut, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';
import { useUiStore } from '@/lib/store/ui.store';
import { useLogout } from '@/lib/hooks/useAuth';

const NAV_ITEMS = [
    { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/portal/documents', label: 'Documents', icon: FolderOpen },
    { href: '/portal/filings', label: 'My Filing', icon: FileText },
    { href: '/portal/payments', label: 'Payments', icon: CreditCard },
    { href: '/portal/consultations', label: 'Consultations', icon: CalendarDays },
    { href: '/portal/messages', label: 'Messages', icon: MessageSquare, badge: true },
    { href: '/portal/support', label: 'Support', icon: LifeBuoy },
];

export default function PortalSidebar() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);
    const unreadMessages = useUiStore((s) => s.unreadMessages);
    const logout = useLogout();

    return (
        <aside
            className="hidden lg:flex flex-col bg-white border-r border-[var(--color-neutral-100)]
                 fixed top-0 left-0 h-full z-30"
            style={{ width: 'var(--portal-sidebar-w)' }}
        >
            {/* Logo */}
            <div className="h-[var(--topbar-h)] flex items-center gap-2.5 px-5 border-b border-[var(--color-neutral-100)]">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-portal-primary)' }}
                >
                    <span className="text-white font-bold text-sm">AP</span>
                </div>
                <span
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--color-portal-primary)' }}
                >
                    Anchor Point
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 portal-scroll">
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
                        const active = pathname === href || pathname.startsWith(href + '/');
                        const count = badge ? unreadMessages : 0;

                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                                        active
                                            ? 'font-semibold text-[var(--color-portal-primary)] bg-[var(--color-portal-primary)]/8'
                                            : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-900)]',
                                    )}
                                >
                                    <Icon
                                        className="w-4 h-4 flex-shrink-0"
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                    <span className="flex-1 truncate">{label}</span>
                                    {count > 0 && (
                                        <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                                     flex items-center justify-center text-white"
                                            style={{ background: 'var(--color-danger)' }}>
                                            {count > 9 ? '9+' : count}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User footer */}
            <div className="border-t border-[var(--color-neutral-100)] p-3 space-y-0.5">
                <Link
                    href="/portal/profile"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]
                     hover:text-[var(--color-neutral-900)] transition-all"
                >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                          text-[10px] font-bold text-white"
                        style={{ background: 'var(--color-portal-primary)' }}>
                        {user?.name?.slice(0, 2).toUpperCase() ?? 'ME'}
                    </div>
                    <span className="flex-1 truncate text-xs">{user?.name ?? 'My Account'}</span>
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
                <button
                    onClick={() => logout.mutate()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-[var(--color-neutral-500)] hover:bg-red-50 hover:text-[var(--color-danger)]
                     transition-all text-left"
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
