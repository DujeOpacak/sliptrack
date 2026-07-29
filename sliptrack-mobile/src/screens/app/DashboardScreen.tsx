import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { dashboardApi } from "../../api/dashboardApi";
import { colors } from "../../theme/colors";
import StatTile from "../../components/StatTile";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import type {
  CategoryAmount,
  DashboardSummary,
  ProviderAmount,
  TimelinePoint,
} from "../../types/dashboard";

const formatEur = (value: number) => `${value.toFixed(2)} €`;

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryAmount[]>([]);
  const [byProvider, setByProvider] = useState<ProviderAmount[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getByCategory(),
        dashboardApi.getByProvider(),
        dashboardApi.getTimeline(),
      ])
        .then(([summaryData, categoryData, providerData, timelineData]) => {
          if (!isActive) return;
          setSummary(summaryData);
          setByCategory(categoryData);
          setByProvider(providerData.slice(0, 6));
          setTimeline(timelineData);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statRow}>
        <StatTile
          label="Plaćeno"
          value={formatEur(summary?.totalPaid ?? 0)}
          subtitle={`${summary?.paidCount ?? 0} uplatnica`}
          accentColor={colors.good}
        />
        <StatTile
          label="Neplaćeno"
          value={formatEur(summary?.totalUnpaid ?? 0)}
          subtitle={`${summary?.unpaidCount ?? 0} uplatnica`}
          accentColor={colors.critical}
        />
      </View>

      <Text style={styles.sectionTitle}>Po kategoriji</Text>
      <View style={styles.card}>
        <BarChart
          data={byCategory.map((c) => ({ label: c.categoryName, value: c.totalAmount }))}
          formatValue={formatEur}
        />
      </View>

      <Text style={styles.sectionTitle}>Po davatelju usluge</Text>
      <View style={styles.card}>
        <BarChart
          data={byProvider.map((p) => ({
            label: p.providerName || "(nepoznato)",
            value: p.totalAmount,
          }))}
          formatValue={formatEur}
        />
      </View>

      <Text style={styles.sectionTitle}>Troškovi kroz vrijeme</Text>
      <View style={styles.card}>
        <LineChart
          data={timeline.map((t) => ({ label: t.period, value: t.totalAmount }))}
          formatValue={formatEur}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statRow: { flexDirection: "row", gap: 12 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gridline,
    padding: 16,
  },
});
