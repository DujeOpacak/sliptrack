import { Fragment, useState } from "react";
import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent } from "react-native";
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
const HEIGHT = 160;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 12;
const MIN_POINT_SPACING = 56;
const Y_AXIS_WIDTH = 56;
const GRIDLINE_COUNT = 4; // 0%, 33%, 66%, 100%
const TOOLTIP_WIDTH = 84;
const TOOLTIP_HEIGHT = 34;

export default function LineChart({ data, formatValue = defaultFormat }: Props) {
  const [scrollWidth, setScrollWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <Text style={styles.emptyText}>Nema podataka za prikaz.</Text>;
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    setScrollWidth(event.nativeEvent.layout.width);
  };

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const chartWidth = Math.max(scrollWidth, data.length * MIN_POINT_SPACING);

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : (i / (data.length - 1)) * (chartWidth - MIN_POINT_SPACING) + MIN_POINT_SPACING / 2;
    const y = PADDING_TOP + plotHeight - (d.value / maxValue) * plotHeight;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const gridlines = Array.from({ length: GRIDLINE_COUNT }, (_, i) => {
    const fraction = i / (GRIDLINE_COUNT - 1);
    return {
      value: maxValue * fraction,
      y: PADDING_TOP + plotHeight - fraction * plotHeight,
    };
  }).reverse();

  const selected = selectedIndex !== null ? points[selectedIndex] : null;
  const showTooltipBelow = selected ? selected.y < TOOLTIP_HEIGHT + 8 : false;

  return (
    <View style={styles.row}>
      <View style={[styles.yAxis, { height: HEIGHT }]}>
        {gridlines.map((g) => (
          <Text key={g.value} style={styles.yAxisLabel}>
            {formatValue(g.value)}
          </Text>
        ))}
      </View>

      <ScrollView horizontal onLayout={handleLayout} showsHorizontalScrollIndicator={false}>
        <View>
          {scrollWidth > 0 && (
            <Svg width={chartWidth} height={HEIGHT}>
              {gridlines.map((g) => (
                <SvgLine
                  key={g.value}
                  x1={0}
                  y1={g.y}
                  x2={chartWidth}
                  y2={g.y}
                  stroke={colors.gridline}
                  strokeWidth={1}
                />
              ))}
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map((p, i) => (
                <Fragment key={p.label}>
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={colors.primary}
                    stroke={colors.surface}
                    strokeWidth={2}
                  />
                  {/* Veci nevidljivi krug samo za lakse pogadjanje dodirom na malu tocku. */}
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="transparent"
                    onPress={() => setSelectedIndex(i === selectedIndex ? null : i)}
                  />
                </Fragment>
              ))}
            </Svg>
          )}

          {selected && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  left: Math.min(
                    Math.max(selected.x - TOOLTIP_WIDTH / 2, 0),
                    chartWidth - TOOLTIP_WIDTH,
                  ),
                  top: showTooltipBelow ? selected.y + 10 : selected.y - TOOLTIP_HEIGHT - 10,
                },
              ]}
            >
              <Text style={styles.tooltipLabel}>{selected.label}</Text>
              <Text style={styles.tooltipValue}>{formatValue(selected.value)}</Text>
            </View>
          )}

          <View style={[styles.xAxis, { width: chartWidth }]}>
            {points.map((p) => (
              <Text key={p.label} style={[styles.xAxisLabel, { width: MIN_POINT_SPACING }]}>
                {p.label}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  yAxis: {
    width: Y_AXIS_WIDTH,
    justifyContent: "space-between",
    paddingBottom: 18,
  },
  yAxisLabel: { fontSize: 11, color: colors.textMuted, textAlign: "right", paddingRight: 6 },
  xAxis: { flexDirection: "row" },
  xAxisLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },
  tooltip: {
    position: "absolute",
    width: TOOLTIP_WIDTH,
    height: TOOLTIP_HEIGHT,
    backgroundColor: colors.textPrimary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  tooltipLabel: { color: colors.surface, fontSize: 10 },
  tooltipValue: { color: colors.surface, fontSize: 12, fontWeight: "700" },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
