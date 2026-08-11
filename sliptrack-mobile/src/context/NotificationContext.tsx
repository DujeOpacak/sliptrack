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
import { navigationRef } from "../navigation/navigationRef";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function extractPaymentSlipId(data: unknown): number | undefined {
  if (!data || typeof data !== "object" || !("paymentSlipId" in data)) {
    return undefined;
  }
  const id = Number((data as { paymentSlipId?: unknown }).paymentSlipId);
  return Number.isFinite(id) ? id : undefined;
}

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

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse) {
      const paymentSlipId = extractPaymentSlipId(response.notification.request.content.data);
      if (paymentSlipId !== undefined && navigationRef.isReady()) {
        navigationRef.navigate("PaymentSlipForm", { paymentSlipId });
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, []);

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
