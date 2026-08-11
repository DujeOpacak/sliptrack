import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { AppTabScreenProps } from "../../navigation/AppTabNavigator";
import { paymentSlipApi } from "../../api/paymentSlipApi";
import { categoryApi } from "../../api/categoryApi";
import { propertyApi } from "../../api/propertyApi";
import type { PaymentSlip, PaymentStatus } from "../../types/paymentSlip";
import type { Category, SubCategory } from "../../types/category";
import type { Property } from "../../types/property";
import { getDueDateRange } from "../../utils/dateRange";
import { colors } from "../../theme/colors";
import SelectField from "../../components/SelectField";

const STATUS_OPTIONS: { label: string; value: PaymentStatus }[] = [
  { label: "Plaćeno", value: "PAID" },
  { label: "Neplaćeno", value: "UNPAID" },
];

type Props = AppTabScreenProps<"PaymentSlipList">;

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

export default function PaymentSlipListScreen({ navigation }: Props) {
  const [paymentSlips, setPaymentSlips] = useState<PaymentSlip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [status, setStatus] = useState<PaymentStatus | undefined>();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subCategoryId, setSubCategoryId] = useState<number | undefined>();
  const [propertyId, setPropertyId] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [month, setMonth] = useState<number | undefined>();

  useEffect(() => {
    categoryApi.getAll().then(setCategories);
    propertyApi.getAll().then(setProperties);
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId(undefined);
      return;
    }
    categoryApi.getSubCategories(categoryId).then((subs) => {
      setSubCategories(subs);
      // Ako nijedna potkategorija ove kategorije ne dopušta nekretninu, filter po
      // nekretnini se sakriva (vidi showPropertyFilter niže) — očisti već odabranu
      // vrijednost da ne ostane tiho aktivan filter koji korisnik više ne vidi.
      if (!subs.some((sc) => sc.allowsProperty)) {
        setPropertyId(undefined);
      }
    });
  }, [categoryId]);

  const handleSubCategoryChange = (newSubCategoryId: number | undefined) => {
    setSubCategoryId(newSubCategoryId);
    const newSubCategory = subCategories.find((sc) => sc.id === newSubCategoryId);
    if (newSubCategoryId && !newSubCategory?.allowsProperty) {
      setPropertyId(undefined);
    }
  };

  const selectedSubCategory = subCategories.find((sc) => sc.id === subCategoryId);
  const showPropertyFilter =
    properties.length > 0 &&
    (subCategoryId
      ? Boolean(selectedSubCategory?.allowsProperty)
      : !categoryId || subCategories.some((sc) => sc.allowsProperty));

  const hasActiveFilters = Boolean(status || categoryId || propertyId || year);

  const handleResetFilters = () => {
    setStatus(undefined);
    setCategoryId(undefined);
    setSubCategoryId(undefined);
    setPropertyId(undefined);
    setYear(undefined);
    setMonth(undefined);
  };

  const fetchPaymentSlips = useCallback(() => {
    const { dueDateFrom, dueDateTo } = getDueDateRange(year, month);
    return paymentSlipApi.getAll({
      status,
      categoryId,
      subCategoryId,
      propertyId,
      dueDateFrom,
      dueDateTo,
    });
  }, [status, categoryId, subCategoryId, propertyId, year, month]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      fetchPaymentSlips()
        .then((data) => {
          if (isActive) setPaymentSlips(data);
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, [fetchPaymentSlips]),
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.headerFilterButton}
          onPress={() => setFiltersVisible(true)}
        >
          <Ionicons
            name={hasActiveFilters ? "filter" : "filter-outline"}
            size={22}
            color={colors.primary}
          />
          {hasActiveFilters && <View style={styles.headerFilterDot} />}
        </Pressable>
      ),
    });
  }, [navigation, hasActiveFilters]);

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

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={paymentSlips}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={paymentSlips.length === 0 && styles.center}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nema uplatnica za odabrane filtere.</Text>
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
      )}

      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFiltersVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filteri</Text>
            <Pressable onPress={() => setFiltersVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView>
            <SelectField
              label="Status"
              placeholder="Svi statusi"
              value={status}
              options={STATUS_OPTIONS}
              onChange={setStatus}
            />

            <SelectField
              label="Kategorija"
              placeholder="Sve kategorije"
              value={categoryId}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
              onChange={setCategoryId}
            />

            {subCategories.length > 0 && (
              <SelectField
                label="Potkategorija"
                placeholder="Sve potkategorije"
                value={subCategoryId}
                options={subCategories.map((sc) => ({
                  label: sc.name,
                  value: sc.id,
                }))}
                onChange={handleSubCategoryChange}
              />
            )}

            <SelectField
              label="Godina dospijeća"
              placeholder="Sve godine"
              value={year}
              options={YEARS.map((y) => ({ label: String(y), value: y }))}
              onChange={(value) => {
                setYear(value);
                if (!value) setMonth(undefined);
              }}
            />

            {year && (
              <SelectField
                label="Mjesec dospijeća"
                placeholder="Svi mjeseci"
                value={month}
                options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
                onChange={setMonth}
              />
            )}

            {showPropertyFilter && (
              <SelectField
                label="Nekretnina"
                placeholder="Sve nekretnine"
                value={propertyId}
                options={properties.map((p) => ({ label: p.name, value: p.id }))}
                onChange={setPropertyId}
              />
            )}
          </ScrollView>

          <Pressable
            style={styles.resetButton}
            onPress={handleResetFilters}
            disabled={!hasActiveFilters}
          >
            <Text
              style={[
                styles.resetButtonText,
                !hasActiveFilters && styles.resetButtonTextDisabled,
              ]}
            >
              Poništi filtere
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  headerFilterButton: { padding: 8, marginRight: 4 },
  headerFilterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "75%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  resetButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  resetButtonText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  resetButtonTextDisabled: { color: colors.textMuted },
  card: {
    backgroundColor: "#eef0f2",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#dde1e6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
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
