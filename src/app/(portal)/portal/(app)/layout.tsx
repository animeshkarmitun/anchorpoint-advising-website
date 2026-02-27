/**
 * This is the authenticated portal shell layout.
 * Route: /portal/(dashboard|documents|filings|...) etc.
 *
 * Auth pages (login/register) live in their own sibling folders under /portal/
 * but are excluded from this shell by the pathname check in the parent layout.tsx.
 *
 * For the definitive fix, these would each be in their own (route-group) folders:
 *   /portal/(auth)/login, /portal/(auth)/register   → bare layout
 *   /portal/(app)/dashboard, ...                    → shell layout
 *
 * For now, the parent layout.tsx handles this with an AUTH_PATHS check,
 * which is adequate for the current scope.
 */
import PortalSidebar from '@/components/portal/layout/PortalSidebar';
import PortalTopbar from '@/components/portal/layout/PortalTopbar';
import PortalBottomNav from '@/components/portal/layout/PortalBottomNav';

export default function PortalShellLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--color-neutral-50)]">
            <PortalSidebar />
            <PortalTopbar />
            <main
                className="pt-[var(--topbar-h)] pb-20 lg:pb-0 lg:pl-[var(--portal-sidebar-w)] min-h-screen"
            >
                <div className="px-4 py-5 sm:px-5 lg:px-8 lg:py-7 max-w-screen-xl mx-auto">
                    {children}
                </div>
            </main>
            <PortalBottomNav />
        </div>
    );
}
