import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { extractTextFromImage, isSupported } from "expo-text-extractor";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList, PickedImage } from "../../navigation/types";
import { parseOcrText } from "../../utils/parseOcrText";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AppStackParamList, "OcrScanPaymentSlip">;

export default function OcrScanScreen({ navigation }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePick = () => {
    Alert.alert("Fotografija uplatnice", undefined, [
      { text: "Odustani", style: "cancel" },
      { text: "Kamera", onPress: () => launchPicker("camera") },
      { text: "Galerija", onPress: () => launchPicker("library") },
    ]);
  };

  const handleFailure = () => {
    Alert.alert(
      "Tekst nije prepoznat",
      "Nismo uspjeli prepoznati podatke na fotografiji. Pokušaj ponovno s jasnijom slikom ili unesi podatke ručno.",
      [
        { text: "Ručni unos", onPress: () => navigation.replace("PaymentSlipForm", undefined) },
        { text: "Pokušaj ponovno", onPress: () => setIsProcessing(false) },
      ],
    );
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

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const sourceImage: PickedImage = {
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName ?? undefined,
    };

    setIsProcessing(true);
    try {
      const lines = await extractTextFromImage(asset.uri);
      const parsed = parseOcrText(lines);
      if (!parsed) {
        handleFailure();
        return;
      }
      navigation.replace("PaymentSlipForm", { ocrData: parsed, sourceImage });
    } catch {
      handleFailure();
    }
  };

  if (!isSupported) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>
          Prepoznavanje teksta nije podržano na ovom uređaju. Koristi ručni unos ili skeniranje
          barkoda.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.replace("PaymentSlipForm", undefined)}
        >
          <Text style={styles.buttonText}>Ručni unos</Text>
        </Pressable>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.hint}>Prepoznajem tekst na fotografiji...</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.hint}>
        Fotografiraj ili odaberi iz galerije jasnu, dobro osvijetljenu fotografiju uplatnice.
      </Text>
      <Pressable style={styles.button} onPress={handlePick}>
        <Text style={styles.buttonText}>Odaberi fotografiju</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
