import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Anchor Point Advising',
        default: 'Portal | Anchor Point Advising',
    },
};

/**
 * Route group for the customer portal.
 * Auth is handled by middleware.ts — this layout is only rendered for
 * authenticated users (login/register are in the same group but bypass auth).
 */
export default function PortalGroupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
