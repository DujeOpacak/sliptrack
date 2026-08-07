import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { dashboardApi } from "../../api/dashboardApi";
import { categoryApi } from "../../api/categoryApi";
import { propertyApi } from "../../api/propertyApi";
import { getDueDateRange } from "../../utils/dateRange";
import { colors } from "../../theme/colors";
import StatTile from "../../components/StatTile";
import BarChart from "../../components/BarChart";
import LineChart from "../../components/LineChart";
import SelectField from "../../components/SelectField";
import type {
  CategoryAmount,
  DashboardSummary,
  PropertySubCategoryAmount,
  ProviderAmount,
  SubCategoryAmount,
  TimelinePoint,
} from "../../types/dashboard";
import type { Category } from "../../types/category";
import type { Property } from "../../types/property";

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

const MONTHS = [
  "Siječanj",
  "Veljača",
  "Ožujak",
  "Travanj",
  "Svibanj",
  "Lipanj",
  "Srpanj",
  "Kolovoz",
  "Rujan",
  "Listopad",
  "Studeni",
  "Prosinac",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

export default function DashboardScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryAmount[]>([]);
  const [byProvider, setByProvider] = useState<ProviderAmount[]>([]);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [subCategoryData, setSubCategoryData] = useState<SubCategoryAmount[]>([]);
  const [isSubCategoryLoading, setIsSubCategoryLoading] = useState(true);
  const [subCategoryCategoryId, setSubCategoryCategoryId] = useState<number | undefined>();
  const [subCategoryPropertyId, setSubCategoryPropertyId] = useState<number | undefined>();
  const [subCategoryYear, setSubCategoryYear] = useState<number | undefined>();
  const [subCategoryMonth, setSubCategoryMonth] = useState<number | undefined>();
  const [propertyComparison, setPropertyComparison] = useState<PropertySubCategoryAmount[]>([]);
  const [isComparisonLoading, setIsComparisonLoading] = useState(true);
  const [comparePropertyIdLeft, setComparePropertyIdLeft] = useState<number | undefined>();
  const [comparePropertyIdRight, setComparePropertyIdRight] = useState<number | undefined>();
  const [comparisonYear, setComparisonYear] = useState<number | undefined>();
  const [comparisonMonth, setComparisonMonth] = useState<number | undefined>();

  const propertyComparisonBySubCategory = useMemo(() => {
    if (!comparePropertyIdLeft || !comparePropertyIdRight) {
      return [];
    }

    const groups = new Map<
      number,
      { subCategoryName: string; bars: { label: string; value: number; propertyId: number }[] }
    >();
    for (const row of propertyComparison) {
      if (row.propertyId !== comparePropertyIdLeft && row.propertyId !== comparePropertyIdRight) {
        continue;
      }
      const group = groups.get(row.subCategoryId) ?? { subCategoryName: row.subCategoryName, bars: [] };
      group.bars.push({ label: row.propertyName, value: row.totalAmount, propertyId: row.propertyId });
      groups.set(row.subCategoryId, group);
    }

    for (const group of groups.values()) {
      group.bars.sort((a, b) =>
        a.propertyId === comparePropertyIdLeft ? -1 : b.propertyId === comparePropertyIdLeft ? 1 : 0,
      );
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.subCategoryName.localeCompare(b.subCategoryName),
    );
  }, [propertyComparison, comparePropertyIdLeft, comparePropertyIdRight]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getByCategory(),
        dashboardApi.getByProvider(),
        categoryApi.getAll(),
        propertyApi.getAll(),
      ])
        .then(([summaryData, categoryData, providerData, categoryList, propertyList]) => {
          if (!isActive) return;
          setSummary(summaryData);
          setByCategory(categoryData);
          setByProvider(providerData.slice(0, 6));
          setCategories(categoryList);
          setProperties(propertyList);

          if (propertyList.length >= 2) {
            setComparePropertyIdLeft(propertyList[0].id);
            setComparePropertyIdRight(propertyList[1].id);
          }
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
    if (properties.length < 2) {
      return;
    }
    let isActive = true;
    setIsComparisonLoading(true);
    const { dueDateFrom, dueDateTo } = getDueDateRange(comparisonYear, comparisonMonth);
    dashboardApi
      .getPropertyComparison({ dueDateFrom, dueDateTo })
      .then((data) => {
        if (isActive) setPropertyComparison(data);
      })
      .finally(() => {
        if (isActive) setIsComparisonLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [properties.length, comparisonYear, comparisonMonth]);

  useEffect(() => {
    let isActive = true;
    setIsSubCategoryLoading(true);
    const { dueDateFrom, dueDateTo } = getDueDateRange(subCategoryYear, subCategoryMonth);
    dashboardApi
      .getBySubCategory({
        categoryId: subCategoryCategoryId,
        propertyId: subCategoryPropertyId,
        dueDateFrom,
        dueDateTo,
      })
      .then((data) => {
        if (isActive) setSubCategoryData(data);
      })
      .finally(() => {
        if (isActive) setIsSubCategoryLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [subCategoryCategoryId, subCategoryPropertyId, subCategoryYear, subCategoryMonth]);

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

      <Text style={styles.sectionTitle}>Po potkategoriji</Text>
      <View style={styles.filterRow}>
        <View style={styles.filterField}>
          <SelectField
            label="Kategorija"
            placeholder="Sve kategorije"
            value={subCategoryCategoryId}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
            onChange={setSubCategoryCategoryId}
          />
        </View>
        {properties.length > 0 && (
          <View style={styles.filterField}>
            <SelectField
              label="Nekretnina"
              placeholder="Sve nekretnine"
              value={subCategoryPropertyId}
              options={properties.map((p) => ({ label: p.name, value: p.id }))}
              onChange={setSubCategoryPropertyId}
            />
          </View>
        )}
      </View>
      <View style={styles.filterRow}>
        <View style={styles.filterField}>
          <SelectField
            label="Godina"
            placeholder="Sve godine"
            value={subCategoryYear}
            options={YEARS.map((y) => ({ label: String(y), value: y }))}
            onChange={(value) => {
              setSubCategoryYear(value);
              if (!value) setSubCategoryMonth(undefined);
            }}
          />
        </View>
        {subCategoryYear && (
          <View style={styles.filterField}>
            <SelectField
              label="Mjesec"
              placeholder="Cijela godina"
              value={subCategoryMonth}
              options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
              onChange={setSubCategoryMonth}
            />
          </View>
        )}
      </View>
      <View style={styles.card}>
        {isSubCategoryLoading ? (
          <View style={styles.timelineLoading}>
            <ActivityIndicator />
          </View>
        ) : (
          <BarChart
            data={subCategoryData.map((sc) => ({
              label: subCategoryCategoryId
                ? sc.subCategoryName
                : `${sc.subCategoryName} (${sc.categoryName})`,
              value: sc.totalAmount,
            }))}
            formatValue={formatEur}
          />
        )}
      </View>

      {properties.length >= 2 && (
        <>
          <Text style={styles.sectionTitle}>Usporedba nekretnina</Text>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <SelectField
                label="Nekretnina 1"
                placeholder="-- odaberi --"
                value={comparePropertyIdLeft}
                options={properties
                  .filter((p) => p.id !== comparePropertyIdRight)
                  .map((p) => ({ label: p.name, value: p.id }))}
                onChange={setComparePropertyIdLeft}
              />
            </View>
            <View style={styles.filterField}>
              <SelectField
                label="Nekretnina 2"
                placeholder="-- odaberi --"
                value={comparePropertyIdRight}
                options={properties
                  .filter((p) => p.id !== comparePropertyIdLeft)
                  .map((p) => ({ label: p.name, value: p.id }))}
                onChange={setComparePropertyIdRight}
              />
            </View>
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <SelectField
                label="Godina"
                placeholder="Sve godine"
                value={comparisonYear}
                options={YEARS.map((y) => ({ label: String(y), value: y }))}
                onChange={(value) => {
                  setComparisonYear(value);
                  if (!value) setComparisonMonth(undefined);
                }}
              />
            </View>
            {comparisonYear && (
              <View style={styles.filterField}>
                <SelectField
                  label="Mjesec"
                  placeholder="Cijela godina"
                  value={comparisonMonth}
                  options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
                  onChange={setComparisonMonth}
                />
              </View>
            )}
          </View>
          {isComparisonLoading ? (
            <View style={styles.card}>
              <View style={styles.timelineLoading}>
                <ActivityIndicator />
              </View>
            </View>
          ) : propertyComparisonBySubCategory.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Nema podataka za prikaz.</Text>
            </View>
          ) : (
            propertyComparisonBySubCategory.map((group) => (
              <View key={group.subCategoryName} style={styles.comparisonGroup}>
                <Text style={styles.comparisonGroupTitle}>{group.subCategoryName}</Text>
                <View style={styles.card}>
                  <BarChart data={group.bars} formatValue={formatEur} />
                </View>
              </View>
            ))
          )}
        </>
      )}

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
  filterRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  filterField: { flex: 1 },
  comparisonGroup: { marginTop: 12 },
  comparisonGroupTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  timelineLoading: { height: 160, justifyContent: "center", alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statRow: { flexDirection: "row", gap: 12 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 28,
    marginBottom: 8,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.gridline,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gridline,
    padding: 16,
  },
});
