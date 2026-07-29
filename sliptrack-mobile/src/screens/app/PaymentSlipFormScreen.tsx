import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { paymentSlipApi } from "../../api/paymentSlipApi";
import { categoryApi } from "../../api/categoryApi";
import { propertyApi } from "../../api/propertyApi";
import type { Category, SubCategory } from "../../types/category";
import type { Property } from "../../types/property";
import type { PaymentStatus } from "../../types/paymentSlip";

type Props = NativeStackScreenProps<AppStackParamList, "PaymentSlipForm">;

function formatDateLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PaymentSlipFormScreen({ navigation, route }: Props) {
  const paymentSlipId = route.params?.paymentSlipId;
  const isEditing = paymentSlipId !== undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentModel, setPaymentModel] = useState("");
  const [providerName, setProviderName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>("UNPAID");
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subCategoryId, setSubCategoryId] = useState<number | undefined>();
  const [propertyId, setPropertyId] = useState<number | undefined>();

  const selectedSubCategory = subCategories.find((sc) => sc.id === subCategoryId);
  const allowsProperty = selectedSubCategory?.allowsProperty ?? false;

  useEffect(() => {
    (async () => {
      const [categoryList, propertyList] = await Promise.all([
        categoryApi.getAll(),
        propertyApi.getAll(),
      ]);
      setCategories(categoryList);
      setProperties(propertyList);

      if (isEditing) {
        const slip = await paymentSlipApi.getById(paymentSlipId);
        setIban(slip.iban);
        setAmount(String(slip.amount));
        setReferenceNumber(slip.referenceNumber ?? "");
        setPaymentModel(slip.paymentModel ?? "");
        setProviderName(slip.providerName ?? "");
        setDescription(slip.description ?? "");
        setDueDate(slip.dueDate ? new Date(slip.dueDate) : null);
        setCategoryId(slip.categoryId ?? undefined);
        if (slip.categoryId) {
          const subs = await categoryApi.getSubCategories(slip.categoryId);
          setSubCategories(subs);
        }
        setSubCategoryId(slip.subCategoryId ?? undefined);
        setPropertyId(slip.propertyId ?? undefined);
        setStatus(slip.status);
      }
      setIsLoading(false);
    })();
  }, []);

  const handleCategoryChange = async (newCategoryId: number) => {
    setCategoryId(newCategoryId);
    setSubCategoryId(undefined);
    setPropertyId(undefined);
    const subs = await categoryApi.getSubCategories(newCategoryId);
    setSubCategories(subs);
  };

  const handleSubCategoryChange = (newSubCategoryId: number | undefined) => {
    setSubCategoryId(newSubCategoryId);
    const newSubCategory = subCategories.find((sc) => sc.id === newSubCategoryId);
    if (!newSubCategory?.allowsProperty) {
      setPropertyId(undefined);
    }
  };

  const handleSave = async () => {
    setError(null);

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!iban.trim()) {
      setError("IBAN je obavezan.");
      return;
    }
    if (!categoryId) {
      setError("Kategorija je obavezna.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Iznos mora biti veći od 0.");
      return;
    }
    if (subCategories.length > 0 && !subCategoryId) {
      setError("Ova kategorija ima potkategorije — potkategorija je obavezna.");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = {
        iban: iban.trim(),
        amount: parsedAmount,
        referenceNumber: referenceNumber || undefined,
        paymentModel: paymentModel || undefined,
        providerName: providerName || undefined,
        description: description || undefined,
        dueDate: dueDate ? formatDateLocal(dueDate) : undefined,
        categoryId,
        subCategoryId,
        propertyId,
      };
      if (isEditing) {
        await paymentSlipApi.update(paymentSlipId, request);
      } else {
        await paymentSlipApi.create(request);
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Spremanje nije uspjelo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!isEditing) return;
    const newStatus: PaymentStatus = status === "PAID" ? "UNPAID" : "PAID";
    setIsTogglingStatus(true);
    try {
      const updated = await paymentSlipApi.updateStatus(paymentSlipId!, newStatus);
      setStatus(updated.status);
    } catch (err: any) {
      Alert.alert(
        "Promjena statusa nije uspjela",
        err?.response?.data?.message ?? "Pokušaj ponovno.",
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = () => {
    if (!isEditing) return;
    Alert.alert("Brisanje uplatnice", "Sigurno želiš obrisati ovu uplatnicu?", [
      { text: "Odustani", style: "cancel" },
      {
        text: "Obriši",
        style: "destructive",
        onPress: async () => {
          try {
            await paymentSlipApi.delete(paymentSlipId!);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert(
              "Brisanje nije moguće",
              err?.response?.data?.message ??
                "Uplatnicu nije moguće obrisati.",
            );
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isEditing && (
        <Pressable
          style={[
            styles.statusButton,
            status === "PAID" ? styles.statusButtonPaid : styles.statusButtonUnpaid,
          ]}
          onPress={handleToggleStatus}
          disabled={isTogglingStatus}
        >
          {isTogglingStatus ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.statusButtonText}>
              {status === "PAID"
                ? "✓ Plaćeno — dodirni za neplaćeno"
                : "Neplaćeno — dodirni za plaćeno"}
            </Text>
          )}
        </Pressable>
      )}
      <TextInput
        style={styles.input}
        placeholder="IBAN primatelja"
        autoCapitalize="characters"
        value={iban}
        onChangeText={setIban}
      />
      <TextInput
        style={styles.input}
        placeholder="Iznos (EUR)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Naziv davatelja usluge"
        value={providerName}
        onChangeText={setProviderName}
      />
      <TextInput
        style={styles.input}
        placeholder="Poziv na broj"
        value={referenceNumber}
        onChangeText={setReferenceNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="Model plaćanja (npr. HR01)"
        autoCapitalize="characters"
        value={paymentModel}
        onChangeText={setPaymentModel}
      />
      <TextInput
        style={styles.input}
        placeholder="Opis"
        value={description}
        onChangeText={setDescription}
      />

      <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={dueDate ? styles.dateText : styles.datePlaceholder}>
          {dueDate ? formatDateLocal(dueDate) : "Datum dospijeća"}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={dueDate ?? new Date()}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === "ios");
            if (event.type !== "dismissed" && selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      <Text style={styles.label}>Kategorija</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={categoryId}
          onValueChange={(value) => value && handleCategoryChange(Number(value))}
        >
          <Picker.Item label="-- odaberi kategoriju --" value={undefined} />
          {categories.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.id} />
          ))}
        </Picker>
      </View>

      {subCategories.length > 0 && (
        <>
          <Text style={styles.label}>Potkategorija</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={subCategoryId}
              onValueChange={(value) =>
                handleSubCategoryChange(value ? Number(value) : undefined)
              }
            >
              <Picker.Item label="-- odaberi potkategoriju --" value={undefined} />
              {subCategories.map((sc) => (
                <Picker.Item key={sc.id} label={sc.name} value={sc.id} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {allowsProperty && (
        <>
          <Text style={styles.label}>Nekretnina</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={propertyId}
              onValueChange={(value) => setPropertyId(value ? Number(value) : undefined)}
            >
              <Picker.Item label="-- bez nekretnine --" value={undefined} />
              {properties.map((p) => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSave} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Spremi</Text>
        )}
      </Pressable>
      {isEditing && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Obriši uplatnicu</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    justifyContent: "center",
  },
  statusButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  statusButtonPaid: { backgroundColor: "#16a34a" },
  statusButtonUnpaid: { backgroundColor: "#dc2626" },
  statusButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  dateText: { fontSize: 16, color: "#000" },
  datePlaceholder: { fontSize: 16, color: "#999" },
  label: { fontSize: 14, color: "#666", marginBottom: 4, marginTop: 4 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", marginBottom: 12, textAlign: "center" },
  deleteButton: { alignItems: "center", marginTop: 24 },
  deleteButtonText: { color: "#dc2626", fontSize: 15, fontWeight: "600" },
});
