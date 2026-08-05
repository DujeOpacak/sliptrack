import { useEffect, useRef, useState } from "react";
import styles from "./LineChart.module.css";

export interface LineChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartPoint[];
  formatValue?: (value: number) => string;
}

const HEIGHT = 200;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 12;
const GRIDLINE_COUNT = 4;

const defaultFormat = (v: number) => String(v);

export function LineChart({ data, formatValue = defaultFormat }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0) {
    return <p className={styles.empty}>Nema podataka za prikaz.</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
    const y = PADDING_TOP + plotHeight - (d.value / maxValue) * plotHeight;
    return { x, y, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const gridlines = Array.from({ length: GRIDLINE_COUNT }, (_, i) => {
    const fraction = i / (GRIDLINE_COUNT - 1);
    return { value: maxValue * fraction, y: PADDING_TOP + plotHeight - fraction * plotHeight };
  }).reverse();

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.yAxis} style={{ height: HEIGHT }}>
        {gridlines.map((g) => (
          <span key={g.value} className={styles.yLabel}>
            {formatValue(g.value)}
          </span>
        ))}
      </div>

      <div className={styles.plotArea} ref={containerRef}>
        {width > 0 && (
          <svg className={styles.svg} width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
            {gridlines.map((g) => (
              <line key={g.value} x1={0} y1={g.y} x2={width} y2={g.y} stroke="var(--border)" strokeWidth={1} />
            ))}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinejoin="miter"
              strokeLinecap="square"
            />
            {points.map((p, i) => (
              <g key={p.label}>
                <rect
                  x={p.x - 4}
                  y={p.y - 4}
                  width={8}
                  height={8}
                  fill="var(--accent)"
                  stroke="var(--bg)"
                  strokeWidth={2}
                />
                <rect
                  x={p.x - 10}
                  y={p.y - 10}
                  width={20}
                  height={20}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
                />
              </g>
            ))}
          </svg>
        )}

        {hovered && (
          <div className={styles.tooltip} style={{ left: hovered.x, top: hovered.y - 10 }}>
            <div className={styles.tooltipMonth}>{hovered.label}</div>
            <div className={styles.tooltipValue}>{formatValue(hovered.value)}</div>
          </div>
        )}

        <div className={styles.xAxis}>
          {points.map((p) => (
            <span key={p.label} className={styles.xLabel}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
