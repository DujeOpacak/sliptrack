import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { dashboardApi } from "../../api/dashboardApi";
import { colors } from "../../theme/colors";
import StatTile from "../../components/StatTile";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import SelectField from "../../components/SelectField";
import type {
  CategoryAmount,
  DashboardSummary,
  ProviderAmount,
  TimelinePoint,
} from "../../types/dashboard";

const formatEur = (value: number) => `${value.toFixed(2)} €`;
const formatEurCompact = (value: number) => `${value.toFixed(0)} €`;

const MONTHS_SHORT = [
  "sij",
  "velj",
  "ožu",
  "tra",
  "svi",
  "lip",
  "srp",
  "kol",
  "ruj",
  "lis",
  "stu",
  "pro",
];

function formatPeriodLabel(period: string) {
  const [year, month] = period.split("-");
  const monthIndex = Number(month) - 1;
  return `${MONTHS_SHORT[monthIndex]} ${year.slice(2)}`;
}

const RANGE_OPTIONS = [
  { label: "Zadnja 3 mjeseca", value: 3 },
  { label: "Zadnjih 6 mjeseci", value: 6 },
  { label: "Zadnjih 12 mjeseci", value: 12 },
  { label: "Zadnja 24 mjeseca", value: 24 },
];

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryAmount[]>([]);
  const [byProvider, setByProvider] = useState<ProviderAmount[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getByCategory(),
        dashboardApi.getByProvider(),
      ])
        .then(([summaryData, categoryData, providerData]) => {
          if (!isActive) return;
          setSummary(summaryData);
          setByCategory(categoryData);
          setByProvider(providerData.slice(0, 6));
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    let isActive = true;
    setIsTimelineLoading(true);
    dashboardApi
      .getTimeline(timelineMonths)
      .then((data) => {
        if (isActive) setTimeline(data);
      })
      .finally(() => {
        if (isActive) setIsTimelineLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [timelineMonths]);

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
      <View style={styles.rangeSelect}>
        <SelectField
          label="Razdoblje"
          placeholder="Zadnjih 6 mjeseci"
          value={timelineMonths}
          options={RANGE_OPTIONS}
          onChange={(value) => setTimelineMonths(value ?? 6)}
        />
      </View>
      <View style={styles.card}>
        {isTimelineLoading ? (
          <View style={styles.timelineLoading}>
            <ActivityIndicator />
          </View>
        ) : (
          <LineChart
            key={timelineMonths}
            data={timeline.map((t) => ({
              label: formatPeriodLabel(t.period),
              value: t.totalAmount,
            }))}
            formatValue={formatEurCompact}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.page },
  content: { padding: 16, paddingBottom: 32 },
  rangeSelect: { marginBottom: 8 },
  timelineLoading: { height: 160, justifyContent: "center", alignItems: "center" },
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
