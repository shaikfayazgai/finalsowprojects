import { create } from "zustand";
import type { AppNotification } from "@/types/enterprise";
import { mockNotifications } from "@/mocks/data/enterprise-dashboard";

interface NotificationState {
  notifications: AppNotification[];
  push: (n: Omit<AppNotification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: mockNotifications,

  push: (n) => {
    const newItem: AppNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ notifications: [newItem, ...state.notifications] }));
  },

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}));
