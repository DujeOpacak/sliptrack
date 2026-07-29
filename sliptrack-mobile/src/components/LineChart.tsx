import { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import Svg, { Polyline, Circle, Line as SvgLine } from "react-native-svg";
import { colors } from "../theme/colors";

export interface LineChartPoint {
  label: string;
  value: number;
}

interface Props {
  data: LineChartPoint[];
  formatValue?: (value: number) => string;
}

const defaultFormat = (value: number) => value.toFixed(0);
const HEIGHT = 140;
const PADDING = 16;

export default function LineChart({ data, formatValue = defaultFormat }: Props) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) {
    return <Text style={styles.emptyText}>Nema podataka za prikaz.</Text>;
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const plotWidth = Math.max(width - PADDING * 2, 1);
  const plotHeight = HEIGHT - PADDING * 2;

  const points = data.map((d, i) => {
    const x =
      PADDING + (data.length === 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
    const y = PADDING + plotHeight - (d.value / maxValue) * plotHeight;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <View onLayout={handleLayout}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <SvgLine
            x1={PADDING}
            y1={PADDING + plotHeight}
            x2={width - PADDING}
            y2={PADDING + plotHeight}
            stroke={colors.gridline}
            strokeWidth={1}
          />
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p) => (
            <Circle
              key={p.label}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={colors.primary}
              stroke={colors.surface}
              strokeWidth={2}
            />
          ))}
        </Svg>
      )}
      <View style={styles.labelRow}>
        <Text style={styles.axisLabel}>{data[0].label}</Text>
        <Text style={styles.endValue}>{formatValue(last.value)}</Text>
        <Text style={styles.axisLabel}>{data[data.length - 1].label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  axisLabel: { fontSize: 11, color: colors.textMuted },
  endValue: { fontSize: 12, color: colors.textPrimary, fontWeight: "600" },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
