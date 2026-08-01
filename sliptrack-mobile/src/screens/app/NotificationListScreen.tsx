import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { notificationApi } from "../../api/notificationApi";
import { useNotifications } from "../../context/NotificationContext";
import type { Notification } from "../../types/notification";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AppStackParamList, "Notifications">;

function formatSentAt(sentAt: string) {
  const [datePart, timePart] = sentAt.split("T");
  return `${datePart} ${timePart?.slice(0, 5) ?? ""}`;
}

export default function NotificationListScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshUnreadCount } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      notificationApi
        .getAll()
        .then((data) => {
          if (isActive) setNotifications(data);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  const handlePress = async (item: Notification) => {
    if (!item.read) {
      try {
        const updated = await notificationApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === updated.id ? updated : n)),
        );
        refreshUnreadCount();
      } catch {
        // best-effort — obavijest ostaje neoznačena, korisnik može ponoviti
      }
    }
    if (item.paymentSlipId) {
      navigation.navigate("PaymentSlipForm", {
        paymentSlipId: item.paymentSlipId,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={notifications.length === 0 && styles.center}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nema obavijesti.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => handlePress(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardMessage}>{item.message}</Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.cardSentAt}>{formatSentAt(item.sentAt)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  cardUnread: { backgroundColor: "#eaf2fc" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardMessage: { fontSize: 15, flexShrink: 1, color: colors.textPrimary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 5,
  },
  cardSentAt: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
});
