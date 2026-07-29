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
import type { AppTabScreenProps } from "../../navigation/AppTabNavigator";
import { paymentSlipApi } from "../../api/paymentSlipApi";
import type { PaymentSlip } from "../../types/paymentSlip";
import { colors } from "../../theme/colors";

type Props = AppTabScreenProps<"PaymentSlipList">;

export default function PaymentSlipListScreen({ navigation }: Props) {
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      paymentSlipApi
        .getAll()
        .then((data) => {
          if (isActive) setPaymentSlips(data);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleToggleStatus = async (item: PaymentSlip) => {
    const newStatus = item.status === "PAID" ? "UNPAID" : "PAID";
    try {
      const updated = await paymentSlipApi.updateStatus(item.id, newStatus);
      setPaymentSlips((prev) =>
        prev.map((slip) => (slip.id === updated.id ? updated : slip)),
      );
    } catch {
      // best-effort — status ostaje nepromijenjen u UI-ju, korisnik može ponoviti
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
        data={paymentSlips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={paymentSlips.length === 0 && styles.center}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nema unesenih uplatnica.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("PaymentSlipForm", {
                paymentSlipId: item.id,
              })
            }
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {item.providerName || "(bez naziva davatelja)"}
              </Text>
              <Pressable
                style={[
                  styles.badge,
                  item.status === "PAID" ? styles.badgePaid : styles.badgeUnpaid,
                ]}
                onPress={() => handleToggleStatus(item)}
              >
                <Text style={styles.badgeText}>
                  {item.status === "PAID" ? "Plaćeno" : "Neplaćeno"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.cardSubtitle}>
              {item.categoryName}
              {item.subCategoryName ? ` · ${item.subCategoryName}` : ""}
            </Text>
            <Text style={styles.cardAmount}>{item.amount.toFixed(2)} EUR</Text>
            {item.dueDate && (
              <Text style={styles.cardDueDate}>Dospijeće: {item.dueDate}</Text>
            )}
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  cardSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  cardAmount: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  cardDueDate: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  badge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  badgePaid: { backgroundColor: "#dcfce7" },
  badgeUnpaid: { backgroundColor: "#fee2e2" },
  badgeText: { fontSize: 12, fontWeight: "600" },
});
