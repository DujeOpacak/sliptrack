import type { CSSProperties } from "react";
import styles from "./StatTile.module.css";

interface StatTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
}

export function StatTile({ label, value, subtitle, accent }: StatTileProps) {
  const style = accent ? ({ "--accent-bar": accent } as CSSProperties) : undefined;
  return (
    <div className={styles.tile} style={style}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}
