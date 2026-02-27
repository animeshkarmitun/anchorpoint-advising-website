import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
    sidebarOpen: boolean;
    language: 'en' | 'bn';
    unreadMessages: number;
    unreadNotifications: number;

    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setLanguage: (lang: 'en' | 'bn') => void;
    setUnreadMessages: (count: number) => void;
    setUnreadNotifications: (count: number) => void;
    incrementUnreadMessages: () => void;
    incrementUnreadNotifications: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set, get) => ({
            sidebarOpen: true,
            language: 'en',
            unreadMessages: 0,
            unreadNotifications: 0,

            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
            setLanguage: (language) => set({ language }),
            setUnreadMessages: (count) => set({ unreadMessages: count }),
            setUnreadNotifications: (count) => set({ unreadNotifications: count }),
            incrementUnreadMessages: () =>
                set({ unreadMessages: get().unreadMessages + 1 }),
            incrementUnreadNotifications: () =>
                set({ unreadNotifications: get().unreadNotifications + 1 }),
        }),
        {
            name: 'apa-ui',
            partialize: (s) => ({ language: s.language, sidebarOpen: s.sidebarOpen }),
        },
    ),
);
