import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
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

  // Push primljen dok je app u pozadini ne mora probuditi addNotificationReceivedListener
  // (obrađuje se na native/OS razini) — nadoknađuje se osvježavanjem kad korisnik vrati app u foreground.
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        refreshUnreadCount();
      }
      appStateRef.current = nextState;
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
