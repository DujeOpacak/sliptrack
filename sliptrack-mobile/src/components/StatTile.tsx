import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  accentColor: string;
}

export default function StatTile({ label, value, subtitle, accentColor }: Props) {
  return (
    <View style={styles.tile}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gridline,
    overflow: "hidden",
  },
  accentBar: { width: 4 },
  content: { flex: 1, padding: 14 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: "600", color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
