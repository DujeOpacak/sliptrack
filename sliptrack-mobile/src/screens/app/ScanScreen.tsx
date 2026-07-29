import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { parseHub3Barcode } from "../../utils/parseHub3";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AppStackParamList, "ScanPaymentSlip">;

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isLocked, setIsLocked] = useState(false);

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isLocked) return;
    setIsLocked(true);

    const parsed = parseHub3Barcode(result.data);
    if (!parsed) {
      Alert.alert(
        "Barkod nije prepoznat",
        "Ovo ne izgleda kao HUB-3 barkod uplatnice. Pokušaj ponovno ili unesi podatke ručno.",
        [
          { text: "Ručni unos", onPress: () => navigation.replace("PaymentSlipForm", undefined) },
          { text: "Pokušaj ponovno", onPress: () => setIsLocked(false) },
        ],
      );
      return;
    }

    navigation.replace("PaymentSlipForm", { scannedData: parsed });
  };

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Za skeniranje barkoda potreban je pristup kameri.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dozvoli pristup kameri</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ["pdf417"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Uperi kameru u PDF417 barkod na uplatnici</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: "80%",
    height: 120,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 8,
  },
  hint: {
    color: "#fff",
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
