import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store/auth.store';

let socket: Socket | null = null;

/**
 * Get (or create) the singleton Socket.io connection.
 *
 * Auth token is sent via `auth.token` handshake — the backend
 * `@WebSocketGateway` validates it the same way as HTTP guards.
 *
 * Uses WebSocket first, falls back to long-polling if WS fails.
 */
export function getSocket(): Socket {
    if (!socket) {
        const url = process.env.NEXT_PUBLIC_API_URL ?? '';
        // Strip /api/v1 suffix — Socket.io connects to root
        const baseUrl = url.replace(/\/api\/v\d+\/?$/, '');

        socket = io(baseUrl, {
            auth: { token: useAuthStore.getState().accessToken },
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            console.log('[socket] connected', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[socket] disconnected', reason);
        });

        socket.on('connect_error', (err) => {
            console.warn('[socket] connection error', err.message);
        });
    }
    return socket;
}

/**
 * Disconnect and destroy the singleton socket.
 * Call this on logout.
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Reconnect with a fresh auth token (e.g. after token refresh).
 */
export function reconnectSocket() {
    disconnectSocket();
    getSocket();
}
