import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export interface BarChartDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarChartDatum[];
  formatValue?: (value: number) => string;
}

const defaultFormat = (value: number) => value.toFixed(2);

export default function BarChart({ data, formatValue = defaultFormat }: Props) {
  if (data.length === 0) {
    return <Text style={styles.emptyText}>Nema podataka za prikaz.</Text>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View>
      {data.map((datum, index) => (
        <View
          key={datum.label}
          style={[styles.row, index > 0 && styles.rowGap]}
        >
          <Text style={styles.label} numberOfLines={1}>
            {datum.label}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                { width: `${Math.max((datum.value / maxValue) * 100, 3)}%` },
              ]}
            />
          </View>
          <Text style={styles.value}>{formatValue(datum.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  rowGap: { marginTop: 10 },
  label: { width: 96, fontSize: 13, color: colors.textSecondary },
  track: { flex: 1, height: 18, justifyContent: "center" },
  bar: {
    height: 18,
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  value: {
    width: 72,
    fontSize: 13,
    color: colors.textPrimary,
    textAlign: "right",
  },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
