import styles from "./BarChart.module.css";

export interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
}

// Nominal categories with no natural order — every bar shares the same accent
// hue; label + length carry identity/magnitude, color would only double-encode.
export function BarChart({ data }: BarChartProps) {
  if (data.length === 0) {
    return <p className={styles.empty}>Nema podataka za prikaz.</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={styles.chart}>
      {data.map((datum) => (
        <div className={styles.row} key={datum.label}>
          <span className={styles.label}>{datum.label}</span>
          <div className={styles.barRow}>
            <div className={styles.track}>
              <div className={styles.bar} style={{ width: `${(datum.value / maxValue) * 100}%` }} />
            </div>
            <span className={styles.value}>{datum.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
