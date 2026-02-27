import apiClient from './client';

export interface Document {
    id: string;
    category: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REUPLOAD';
    rejectionNote?: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface ChecklistItem {
    id: string;
    category: string;
    label: string;
    labelBn?: string;
    description?: string;
    isRequired: boolean;
    isReusable: boolean;
    sortOrder: number;
    document: Document | null;
    previousDocument?: { id: string; assessmentYear: string } | null;
}

export interface ChecklistResponse {
    filingId: string;
    serviceType: string;
    assessmentYear: string;
    template?: { id: string; name: string };
    checklist: ChecklistItem[];
    completionRate: number;
}

export const documentsApi = {
    // Customer: list own documents
    list: (params?: { category?: string; status?: string; filingId?: string; page?: number }) =>
        apiClient.get('/documents/my', { params }).then((r) => r.data.data),

    // Customer: get checklist for a filing
    getChecklist: (filingId: string): Promise<ChecklistResponse> =>
        apiClient.get(`/documents/checklist/${filingId}`).then((r) => r.data.data),

    // Customer: upload a document
    upload: (file: File, category: string, filingId?: string) => {
        const form = new FormData();
        form.append('file', file);
        form.append('category', category);
        if (filingId) form.append('filingId', filingId);
        return apiClient.post('/documents/upload', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data.data);
    },

    // Customer: re-upload rejected doc
    reupload: (documentId: string, file: File) => {
        const form = new FormData();
        form.append('file', file);
        return apiClient.post(`/documents/${documentId}/reupload`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data.data);
    },

    // Authenticated download — returns a Blob (backend streams decrypted bytes)
    download: async (documentId: string): Promise<Blob> => {
        const res = await apiClient.get(`/documents/${documentId}/download`, {
            responseType: 'blob',
        });
        return res.data;
    },

    // Open document in a new tab without exposing the raw URL
    openInNewTab: async (documentId: string, mimeType: string, fileName: string) => {
        const blob = await documentsApi.download(documentId);
        const objUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
        const a = document.createElement('a');
        a.href = objUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.download = fileName;
        a.click();
        // Revoke after a tick so the browser has time to start the download
        setTimeout(() => URL.revokeObjectURL(objUrl), 10_000);
    },

    // Customer: delete PENDING document
    delete: (documentId: string) =>
        apiClient.delete(`/documents/${documentId}`).then((r) => r.data),

    // Reuse a document from a previous filing
    reuse: (previousDocId: string, filingId: string) =>
        apiClient.post(`/documents/${previousDocId}/reuse`, { filingId }).then((r) => r.data.data),
};
