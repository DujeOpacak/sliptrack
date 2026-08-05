import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/AdminLayout";
import { StatTile } from "../components/StatTile";
import { CategoriesIcon, StatsIcon, UsersIcon } from "../components/icons";
import { adminApi } from "../api/adminApi";
import { extractErrorMessage } from "../api/errors";
import type { AdminStats } from "../types/admin";
import styles from "./DashboardPage.module.css";

const QUICK_LINKS = [
  { to: "/categories", label: "Kategorije", subtitle: "Upravljaj kategorijama i potkategorijama", icon: CategoriesIcon },
  { to: "/users", label: "Korisnici", subtitle: "Pregled računa, aktivacija/deaktivacija", icon: UsersIcon },
  { to: "/stats", label: "Statistika", subtitle: "Puni pregled sustava", icon: StatsIcon },
];

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setStats(await adminApi.getStats());
      } catch (err) {
        setError(extractErrorMessage(err, "Statistika se nije mogla učitati"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const topThree = stats?.topCategories.slice(0, 3) ?? [];

  return (
    <>
      <PageHeader title="Pregled" subtitle="Stanje sustava u kratkim crtama." />

      {isLoading && <p style={{ color: "var(--text-muted)" }}>Učitavanje...</p>}
      {error && <p className="error-text">{error}</p>}

      {stats && (
        <div className={styles.statGrid}>
          <StatTile label="Ukupno korisnika" value={stats.totalUsers} />
          <StatTile label="Aktivni korisnici" value={stats.activeUsers} accent="var(--good)" />
          <StatTile label="Ukupno uplatnica" value={stats.totalPaymentSlips} />
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Top 3 kategorije</div>
          {topThree.length === 0 ? (
            <p className={styles.empty}>Nema podataka.</p>
          ) : (
            <div className={styles.rankList}>
              {topThree.map((c, i) => (
                <div className={styles.rankRow} key={c.categoryId}>
                  <span className={styles.rankIndex}>{i + 1}</span>
                  <span className={styles.rankLabel}>{c.categoryName}</span>
                  <span className={styles.rankValue}>{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Brzi pristup</div>
          <div className={styles.linkGrid}>
            {QUICK_LINKS.map(({ to, label, subtitle, icon: Icon }) => (
              <Link className={styles.linkCard} to={to} key={to}>
                <Icon className={styles.linkIcon} width={20} height={20} />
                <div>
                  <div className={styles.linkTitle}>{label}</div>
                  <div className={styles.linkSubtitle}>{subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
