import apiClient from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CmsSection {
    id:        string;
    section:   string;
    locale:    string;
    data:      Record<string, unknown>;
    updatedAt: string;
    updatedBy?: string | null;
}

export interface SeoRecord {
    id:              string;
    page:            string;
    locale:          string;
    metaTitle:       string;
    metaDescription: string;
    ogImage?:        string | null;
    canonical?:      string | null;
    keywords?:       string | null;
    updatedAt:       string;
}

// ── CMS Admin API ─────────────────────────────────────────────────────────────

export const cmsApi = {
    /** List all CMS content */
    listAll: (): Promise<CmsSection[]> =>
        apiClient.get('/admin/cms').then((r) => r.data.data),

    /** Upsert section */
    upsert: (section: string, locale: string, data: Record<string, unknown>) =>
        apiClient.put(`/admin/cms/${section}`, { data }, { params: { locale } })
            .then((r) => r.data),

    /** Delete section (revert to default) */
    delete: (section: string, locale: string) =>
        apiClient.delete(`/admin/cms/${section}`, { params: { locale } })
            .then((r) => r.data),
};

// ── SEO Admin API ─────────────────────────────────────────────────────────────

export const seoApi = {
    /** List all SEO records */
    listAll: (locale?: string): Promise<SeoRecord[]> =>
        apiClient.get('/admin/seo', { params: { locale } }).then((r) => r.data.data),

    /** Upsert page SEO */
    upsert: (page: string, locale: string, data: Partial<SeoRecord>) =>
        apiClient.put(`/admin/seo/${page}`, data, { params: { locale } })
            .then((r) => r.data),

    /** Delete page SEO (fallback to default) */
    delete: (page: string, locale: string) =>
        apiClient.delete(`/admin/seo/${page}`, { params: { locale } })
            .then((r) => r.data),
};
