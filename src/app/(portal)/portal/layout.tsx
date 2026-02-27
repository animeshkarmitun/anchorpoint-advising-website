'use client';

import { usePathname } from 'next/navigation';
import PortalSidebar from '@/components/portal/layout/PortalSidebar';
import PortalTopbar from '@/components/portal/layout/PortalTopbar';
import PortalBottomNav from '@/components/portal/layout/PortalBottomNav';

/** Auth-only pages — no sidebar/nav chrome */
const AUTH_PATHS = [
    '/portal/login',
    '/portal/register',
    '/portal/forgot-password',
    '/portal/reset-password',
    '/portal/onboarding',
];

export default function PortalShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

    // Auth pages: render children bare — no shell
    if (isAuth) return <>{children}</>;

    // Authenticated pages: full shell
    return (
        <div className="min-h-screen bg-[var(--color-neutral-50)]">
            <PortalSidebar />
            <PortalTopbar />

            <main
                className="pt-[var(--topbar-h)] pb-20 lg:pb-0
                   lg:pl-[var(--portal-sidebar-w)]
                   min-h-screen"
            >
                <div className="px-4 py-5 sm:px-5 lg:px-8 lg:py-7 max-w-screen-xl mx-auto">
                    {children}
                </div>
            </main>

            <PortalBottomNav />
        </div>
    );
}
