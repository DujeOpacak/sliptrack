import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as Notifications from "expo-notifications";
import { notificationApi } from "../api/notificationApi";

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const notifications = await notificationApi.getAll();
      setUnreadCount(notifications.filter((n) => !n.read).length);
    } catch {
      // best-effort — badge ostaje na zadnjoj poznatoj vrijednosti
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    const subscription = Notifications.addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });
    return () => subscription.remove();
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
