import React, { useEffect, useMemo, useState } from "react";
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
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { paymentSlipApi } from "../../api/paymentSlipApi";
import { categoryApi } from "../../api/categoryApi";
import { propertyApi } from "../../api/propertyApi";
import type { Category, SubCategory } from "../../types/category";
import type { Property } from "../../types/property";
import type { PaymentStatus } from "../../types/paymentSlip";
import { colors } from "../../theme/colors";
import SelectField from "../../components/SelectField";

interface PickedImage {
  uri: string;
  mimeType?: string;
  fileName?: string;
}

type Props = NativeStackScreenProps<AppStackParamList, "PaymentSlipForm">;

function formatDateLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function PaymentSlipFormScreen({ navigation, route }: Props) {
  const paymentSlipId =
    route.params && "paymentSlipId" in route.params
      ? route.params.paymentSlipId
      : undefined;
  const scannedData =
    route.params && "scannedData" in route.params
      ? route.params.scannedData
      : undefined;
  const isEditing = paymentSlipId !== undefined;
  const wasScanned = scannedData !== undefined;

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
  const [paidAt, setPaidAt] = useState<Date | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showPaidAtPicker, setShowPaidAtPicker] = useState(false);
  const [draftPaidAt, setDraftPaidAt] = useState(new Date());
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [subCategoryId, setSubCategoryId] = useState<number | undefined>();
  const [propertyId, setPropertyId] = useState<number | undefined>();

  // Stabilna referenca — new Date() ne smije se računati iznova pri svakom rendera
  // dok je Android picker otvoren, jer se native modul zbuni i resetira prikaz na epoch (01.01.1970).
  const today = useMemo(() => new Date(), []);

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
        setPaidAt(slip.paidAt ? new Date(slip.paidAt) : null);
        setExistingImageUrl(slip.imageUrl);
      } else if (scannedData) {
        setIban(scannedData.iban);
        setAmount(String(scannedData.amount));
        setReferenceNumber(scannedData.referenceNumber ?? "");
        setPaymentModel(scannedData.paymentModel ?? "");
        setProviderName(scannedData.providerName ?? "");
        setDescription(scannedData.description ?? "");
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

  const handlePickImage = () => {
    Alert.alert("Fotografija uplatnice", undefined, [
      { text: "Odustani", style: "cancel" },
      { text: "Kamera", onPress: () => launchPicker("camera") },
      { text: "Galerija", onPress: () => launchPicker("library") },
    ]);
  };

  const launchPicker = async (source: "camera" | "library") => {
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Pristup odbijen",
        source === "camera"
          ? "Potreban je pristup kameri za fotografiranje uplatnice."
          : "Potreban je pristup galeriji za odabir fotografije.",
      );
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedImage({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName ?? undefined,
      });
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
    if (!dueDate) {
      setError("Datum dospijeća je obavezan.");
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
        dueDate: formatDateLocal(dueDate),
        categoryId,
        subCategoryId,
        propertyId,
        wasScanned: !isEditing && wasScanned,
      };
      const savedId = isEditing
        ? (await paymentSlipApi.update(paymentSlipId, request)).id
        : (await paymentSlipApi.create(request)).id;

      if (pickedImage) {
        try {
          await paymentSlipApi.uploadImage(savedId, pickedImage);
        } catch {
          Alert.alert(
            "Slika nije spremljena",
            "Uplatnica je spremljena, ali fotografija nije uspjela poslati. Pokušaj ponovno kroz uređivanje.",
          );
        }
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Spremanje nije uspjelo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyStatusChange = async (newStatus: PaymentStatus, newPaidAt?: Date) => {
    setIsTogglingStatus(true);
    try {
      const updated = await paymentSlipApi.updateStatus(
        paymentSlipId!,
        newStatus,
        newPaidAt ? formatDateLocal(newPaidAt) : undefined,
      );
      setStatus(updated.status);
      setPaidAt(updated.paidAt ? new Date(updated.paidAt) : null);
    } catch (err: any) {
      Alert.alert(
        "Promjena statusa nije uspjela",
        err?.response?.data?.message ?? "Pokušaj ponovno.",
      );
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleToggleStatus = () => {
    if (!isEditing) return;
    if (status === "PAID") {
      void applyStatusChange("UNPAID");
      return;
    }
    setDraftPaidAt(new Date());
    setShowPaidAtPicker(true);
  };

  const handleEditPaidAt = () => {
    if (!isEditing || status !== "PAID") return;
    setDraftPaidAt(paidAt ?? new Date());
    setShowPaidAtPicker(true);
  };

  const handlePaidAtChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPaidAtPicker(false);
      if (event.type !== "dismissed" && selectedDate) {
        void applyStatusChange("PAID", selectedDate);
      }
    } else if (selectedDate) {
      setDraftPaidAt(selectedDate);
    }
  };

  const handleConfirmPaidAt = () => {
    setShowPaidAtPicker(false);
    void applyStatusChange("PAID", draftPaidAt);
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
      {wasScanned && !isEditing && (
        <View style={styles.scanBanner}>
          <Text style={styles.scanBannerText}>
            Podaci popunjeni skeniranjem — provjeri prije spremanja.
          </Text>
        </View>
      )}
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
      {isEditing && status === "PAID" && (
        <Pressable style={styles.paidAtRow} onPress={handleEditPaidAt}>
          <Text style={styles.paidAtText}>
            Plaćeno: {paidAt ? formatDateLocal(paidAt) : "—"}
          </Text>
          <Text style={styles.paidAtEdit}>Promijeni</Text>
        </Pressable>
      )}
      {showPaidAtPicker && (
        <View style={styles.paidAtPickerWrapper}>
          <DateTimePicker
            value={draftPaidAt}
            mode="date"
            maximumDate={new Date()}
            onChange={handlePaidAtChange}
          />
          {Platform.OS === "ios" && (
            <Pressable style={styles.button} onPress={handleConfirmPaidAt}>
              <Text style={styles.buttonText}>Potvrdi datum plaćanja</Text>
            </Pressable>
          )}
        </View>
      )}
      <Text style={styles.label}>Fotografija uplatnice</Text>
      <Pressable
        style={styles.imagePicker}
        onPress={() =>
          pickedImage || existingImageUrl ? setIsViewerVisible(true) : handlePickImage()
        }
      >
        {pickedImage || existingImageUrl ? (
          <>
            <Image
              source={{ uri: pickedImage?.uri ?? existingImageUrl! }}
              style={styles.imagePreview}
            />
            <Pressable style={styles.imageChangeButton} onPress={handlePickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </Pressable>
          </>
        ) : (
          <Text style={styles.imagePickerText}>+ Dodaj fotografiju</Text>
        )}
      </Pressable>

      <Modal
        visible={isViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsViewerVisible(false)}
      >
        <Pressable
          style={styles.viewerBackdrop}
          onPress={() => setIsViewerVisible(false)}
        >
          <Image
            source={{ uri: pickedImage?.uri ?? existingImageUrl ?? "" }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
          <Pressable
            style={styles.viewerCloseButton}
            onPress={() => setIsViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>

      <Text style={styles.label}>IBAN primatelja</Text>
      <TextInput
        style={styles.input}
        placeholder="HR12 1234 5678 9012 3456 7"
        autoCapitalize="characters"
        value={iban}
        onChangeText={setIban}
      />
      <Text style={styles.label}>Iznos (EUR)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Text style={styles.label}>Naziv davatelja usluge</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. HEP Elektra"
        value={providerName}
        onChangeText={setProviderName}
      />
      <Text style={styles.label}>Poziv na broj</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. 1234567890"
        value={referenceNumber}
        onChangeText={setReferenceNumber}
      />
      <Text style={styles.label}>Model plaćanja</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. HR01"
        autoCapitalize="characters"
        value={paymentModel}
        onChangeText={setPaymentModel}
      />
      <Text style={styles.label}>Opis</Text>
      <TextInput
        style={styles.input}
        placeholder="npr. Struja - srpanj 2026"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Datum dospijeća</Text>
      <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={dueDate ? styles.dateText : styles.datePlaceholder}>
          {dueDate ? formatDateLocal(dueDate) : "Odaberi datum"}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={dueDate ?? today}
          mode="date"
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === "ios");
            if (event.type !== "dismissed" && selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      <SelectField
        label="Kategorija"
        placeholder="-- odaberi kategoriju --"
        value={categoryId}
        options={categories.map((c) => ({ label: c.name, value: c.id }))}
        onChange={(value) => value && handleCategoryChange(value)}
      />

      {subCategories.length > 0 && (
        <SelectField
          label="Potkategorija"
          placeholder="-- odaberi potkategoriju --"
          value={subCategoryId}
          options={subCategories.map((sc) => ({ label: sc.name, value: sc.id }))}
          onChange={handleSubCategoryChange}
        />
      )}

      {allowsProperty && (
        <SelectField
          label="Nekretnina"
          placeholder="-- bez nekretnine --"
          value={propertyId}
          options={properties.map((p) => ({ label: p.name, value: p.id }))}
          onChange={setPropertyId}
        />
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
  paidAtRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  paidAtText: { fontSize: 14, color: colors.textSecondary },
  paidAtEdit: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  paidAtPickerWrapper: { marginBottom: 16 },
  scanBanner: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  scanBannerText: { color: "#1d4ed8", fontSize: 13, textAlign: "center" },
  imagePicker: {
    borderWidth: 1,
    borderColor: colors.gridline,
    borderRadius: 8,
    marginBottom: 16,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  imagePickerText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  imagePreview: { width: "100%", height: "100%" },
  imageChangeButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerImage: { width: "100%", height: "80%" },
  viewerCloseButton: {
    position: "absolute",
    top: 48,
    right: 24,
    padding: 8,
  },
  dateText: { fontSize: 16, color: "#000" },
  datePlaceholder: { fontSize: 16, color: "#999" },
  label: { fontSize: 14, color: "#666", marginBottom: 4, marginTop: 4 },
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
