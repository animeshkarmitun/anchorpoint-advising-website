import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { authBridge } from './authBridge';
import { REFRESH_COOKIE_NAME } from '@/lib/constants';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/** Read a cookie value by name (client-side only) */
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

/** Set a cookie (client-side only) */
function setCookie(name: string, value: string, maxAge: number) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

export const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,   // sends httpOnly refresh-token cookie automatically
    timeout: 30_000,
});

// ── Request interceptor: attach access token ──────────────────────────────────
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = authBridge.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response interceptor: silent refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue: {
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token as string),
    );
    failedQueue = [];
}

apiClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only handle 401 once per request; pass through all other errors immediately
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Queue this request until the in-flight refresh completes
            return new Promise<string>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                return apiClient(original);
            });
        }

        original._retry = true;
        isRefreshing = true;

        try {
            // Read the refresh token from the cookie
            const refreshToken = getCookie(REFRESH_COOKIE_NAME);
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(
                `${BASE_URL}/auth/refresh`,
                { refreshToken },
                { withCredentials: true },
            );
            const newAccessToken: string = data?.data?.accessToken ?? data?.accessToken;
            const newRefreshToken: string | undefined = data?.data?.refreshToken ?? data?.refreshToken;

            // Update in-memory token via the bridge
            authBridge.setAccessToken(newAccessToken);

            // Rotate the refresh cookie if a new one was returned
            if (newRefreshToken) {
                setCookie(REFRESH_COOKIE_NAME, newRefreshToken, 7 * 24 * 60 * 60);
            }

            original.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return apiClient(original);
        } catch (refreshError) {
            processQueue(refreshError, null);
            authBridge.logout();
            if (typeof window !== 'undefined') {
                const isAdmin = window.location.pathname.startsWith('/admin');
                window.location.href = isAdmin ? '/admin/login' : '/portal/login';
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    },
);

export default apiClient;
