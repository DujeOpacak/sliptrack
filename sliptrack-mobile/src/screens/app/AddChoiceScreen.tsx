import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { colors } from "../../theme/colors";

type Props = NativeStackScreenProps<AppStackParamList, "AddChoice">;

export default function AddChoiceScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.option}
        onPress={() => navigation.replace("ScanPaymentSlip")}
      >
        <Ionicons name="barcode-outline" size={40} color={colors.primary} />
        <Text style={styles.optionTitle}>Skeniraj barkod</Text>
        <Text style={styles.optionSubtitle}>PDF417 (HUB-3) na uplatnici</Text>
      </Pressable>
      <Pressable
        style={styles.option}
        onPress={() => navigation.replace("OcrScanPaymentSlip")}
      >
        <Ionicons name="camera-outline" size={40} color={colors.primary} />
        <Text style={styles.optionTitle}>OCR fotografija</Text>
        <Text style={styles.optionSubtitle}>Kad barkod ne postoji ili ne radi</Text>
      </Pressable>
      <Pressable
        style={styles.option}
        onPress={() => navigation.replace("PaymentSlipForm", undefined)}
      >
        <Ionicons name="create-outline" size={40} color={colors.primary} />
        <Text style={styles.optionTitle}>Ručni unos</Text>
        <Text style={styles.optionSubtitle}>Upiši podatke sam</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, justifyContent: "center" },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gridline,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 12,
  },
  optionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
