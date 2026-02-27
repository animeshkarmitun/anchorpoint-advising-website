'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, FileStack, FolderKanban,
    CreditCard, CalendarDays, MessageSquare, LifeBuoy,
    FileEdit, ChevronLeft, ChevronRight, BarChart3,
    ClipboardList, Settings, ShieldCheck, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth.store';
import { useUiStore } from '@/lib/store/ui.store';
import { useLogout } from '@/lib/hooks/useAuth';

const ADMIN_NAV = [
    {
        group: 'OVERVIEW',
        items: [
            { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
        ],
    },
    {
        group: 'OPERATIONS',
        items: [
            { href: '/admin/customers', label: 'Customers', icon: Users },
            { href: '/admin/documents', label: 'Review Queue', icon: FileStack, badge: 'docs' },
            { href: '/admin/filings', label: 'Filings', icon: FolderKanban },
            { href: '/admin/payments', label: 'Payments', icon: CreditCard },
            { href: '/admin/consultations', label: 'Consultations', icon: CalendarDays },
            { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
            { href: '/admin/support', label: 'Support', icon: LifeBuoy },
        ],
    },
    {
        group: 'CONTENT',
        items: [
            { href: '/admin/checklists', label: 'Checklists', icon: ClipboardList },
            { href: '/admin/cms', label: 'CMS Editor', icon: FileEdit },
            { href: '/admin/seo', label: 'SEO Settings', icon: Settings },
        ],
    },
    {
        group: 'SYSTEM',
        items: [
            { href: '/admin/staff', label: 'Staff', icon: ShieldCheck, superAdminOnly: true },
        ],
    },
];

const AUTH_PATHS = ['/admin/login'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));
    const { sidebarOpen, toggleSidebar } = useUiStore();
    const user = useAuthStore((s) => s.user);
    const logout = useLogout();

    if (isAuth) return <>{children}</>;

    return (
        <div className="min-h-screen bg-[var(--color-neutral-50)] flex">

            {/* ── Sidebar ─────────────────────────────────────────────────────── */}
            <aside
                className={cn(
                    'hidden lg:flex flex-col fixed top-0 left-0 h-full z-30 bg-white',
                    'border-r border-[var(--color-neutral-100)] transition-all duration-200',
                    sidebarOpen ? 'w-[var(--admin-sidebar-w)]' : 'w-[56px]',
                )}
            >
                {/* Logo + collapse button */}
                <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--color-neutral-100)] flex-shrink-0">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--color-admin-bg)' }}>
                                <span className="text-white font-bold text-xs">AP</span>
                            </div>
                            <span className="font-semibold text-xs text-indigo-900 whitespace-nowrap">Admin Panel</span>
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            'w-7 h-7 flex items-center justify-center rounded-lg',
                            'text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] transition-all flex-shrink-0',
                            !sidebarOpen && 'mx-auto',
                        )}
                    >
                        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Nav groups */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 portal-scroll">
                    {ADMIN_NAV.map(({ group, items }) => (
                        <div key={group}>
                            {sidebarOpen && (
                                <p className="text-[10px] font-semibold text-[var(--color-neutral-400)] tracking-wider
                               px-2 mb-1.5 uppercase">
                                    {group}
                                </p>
                            )}
                            <ul className="space-y-0.5">
                                {items.map(({ href, label, icon: Icon, superAdminOnly }) => {
                                    if (superAdminOnly && user?.role !== 'SUPER_ADMIN') return null;
                                    const active = pathname === href || pathname.startsWith(href + '/');

                                    return (
                                        <li key={href}>
                                            <Link
                                                href={href}
                                                title={!sidebarOpen ? label : undefined}
                                                className={cn(
                                                    'flex items-center rounded-lg transition-all',
                                                    sidebarOpen ? 'gap-2.5 px-2.5 py-2' : 'justify-center w-8 h-8 mx-auto',
                                                    active
                                                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                        : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-900)]',
                                                )}
                                            >
                                                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
                                                {sidebarOpen && (
                                                    <span className="text-sm truncate">{label}</span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="border-t border-[var(--color-neutral-100)] p-2 flex-shrink-0">
                    {sidebarOpen ? (
                        <div className="flex items-center gap-2 px-2 py-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                              text-white flex-shrink-0 uppercase"
                                style={{ background: 'var(--color-admin-bg)' }}>
                                {user?.name?.slice(0, 2) ?? 'AD'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--color-neutral-900)] truncate">{user?.name}</p>
                                <p className="text-[10px] text-[var(--color-neutral-400)] capitalize">
                                    {user?.role === 'SUPER_ADMIN' ? '⭐ Super Admin' : user?.role?.toLowerCase().replace('_', ' ')}
                                </p>
                            </div>
                            <button
                                onClick={() => logout.mutate()}
                                title="Logout"
                                className="text-[var(--color-neutral-400)] hover:text-[var(--color-danger)] transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => logout.mutate()}
                            title="Logout"
                            className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg
                         text-[var(--color-neutral-400)] hover:bg-red-50 hover:text-[var(--color-danger)] transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </aside>

            {/* ── Main ──────────────────────────────────────────────────────────── */}
            <div
                className={cn(
                    'flex-1 flex flex-col min-h-screen transition-all duration-200',
                    'lg:' + (sidebarOpen ? 'pl-[var(--admin-sidebar-w)]' : 'pl-[56px]'),
                )}
            >
                {/* Topbar */}
                <header
                    className="h-[var(--topbar-h)] bg-white border-b border-[var(--color-neutral-100)]
                     flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-20"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--color-admin-bg)' }}>
                            <span className="text-white font-bold text-xs">AP</span>
                        </div>
                        <span className="text-xs font-semibold text-indigo-900">Admin</span>
                    </div>

                    <div className="flex-1" />

                    {/* User chip */}
                    <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-600)]">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold
                            text-white uppercase"
                            style={{ background: 'var(--color-admin-bg)' }}>
                            {user?.name?.slice(0, 2) ?? 'AD'}
                        </div>
                        <span className="hidden sm:block">{user?.name}</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
