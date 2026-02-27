import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: '%s | Admin — Anchor Point',
        default: 'Admin Panel | Anchor Point Advising',
    },
};

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
