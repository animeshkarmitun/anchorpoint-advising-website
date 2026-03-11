/**
 * Shared runtime constants — single source of truth.
 * Both the middleware (edge runtime) and the Axios client read from here.
 */

/** Cookie name set by the backend on successful login. MUST match NestJS config. */
export const REFRESH_COOKIE_NAME = 'apa_refresh';

/** Minimum touch target size per WCAG 2.5.5 */
export const MIN_TOUCH_TARGET = 44;

/** Default stale time for API queries (ms) */
export const DEFAULT_STALE_TIME = 60_000;

/** Portal auth paths — layout and middleware both use this list */
export const PORTAL_AUTH_PATHS = [
    '/portal/login',
    '/portal/register',
    '/portal/forgot-password',
    '/portal/reset-password',
    '/portal/onboarding',
] as const;

/** Admin auth paths */
export const ADMIN_AUTH_PATHS = ['/admin/login'] as const;

/** Admin colour — used in both layout and login page */
export const ADMIN_COLOR = '#312E81';
