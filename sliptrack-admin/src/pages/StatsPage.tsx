import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/AdminLayout";
import { StatTile } from "../components/StatTile";
import { BarChart } from "../components/BarChart";
import { LineChart } from "../components/LineChart";
import { adminApi } from "../api/adminApi";
import { categoryApi } from "../api/categoryApi";
import { extractErrorMessage } from "../api/errors";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/formatDate";
import { lastNMonths } from "../utils/months";
import { downloadCsv, rowsToCsv } from "../utils/csv";
import type { AdminCategoryCount, AdminStats, AdminSubCategoryCount, AdminUser } from "../types/admin";
import type { Category } from "../types/category";
import styles from "./StatsPage.module.css";

const PERIOD_OPTIONS = [3, 6, 12, 24];
const ALL_CATEGORIES = "ALL";

export function StatsPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<AdminCategoryCount[]>([]);
  const [subCategoryCounts, setSubCategoryCounts] = useState<AdminSubCategoryCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodMonths, setPeriodMonths] = useState(6);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsData, usersData, categoriesData, categoryCountsData, subCategoryCountsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getUsers(),
          categoryApi.getAll(),
          adminApi.getCategoryStats(),
          adminApi.getSubCategoryStats(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setCategories(categoriesData);
        setCategoryCounts(categoryCountsData);
        setSubCategoryCounts(subCategoryCountsData);
      } catch (err) {
        setError(extractErrorMessage(err, "Statistika se nije mogla učitati"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const userCount = users.filter((u) => u.role === "USER").length;
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const registrationsTimeline = useMemo(() => {
    const months = lastNMonths(periodMonths);
    const countsByKey = new Map<string, number>();
    for (const u of users) {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      countsByKey.set(key, (countsByKey.get(key) ?? 0) + 1);
    }
    return months.map((m) => ({ label: m.label, value: countsByKey.get(m.key) ?? 0 }));
  }, [users, periodMonths]);

  const selectedCategoryId = categoryFilter === ALL_CATEGORIES ? null : Number(categoryFilter);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;
  const categoryBreakdownData =
    selectedCategoryId === null
      ? categoryCounts.map((c) => ({ label: c.categoryName, value: c.count }))
      : subCategoryCounts
          .filter((s) => s.categoryId === selectedCategoryId)
          .map((s) => ({ label: s.subCategoryName, value: s.count }));
  const selectedCategoryTotal = categoryCounts.find((c) => c.categoryId === selectedCategoryId)?.count ?? 0;

  function handleExportCsv() {
    if (!stats) return;
    const rows: (string | number)[][] = [
      ["Sažetak"],
      ["Ukupno korisnika", stats.totalUsers],
      ["Aktivni korisnici", stats.activeUsers],
      ["Neaktivni korisnici", stats.totalUsers - stats.activeUsers],
      ["Ukupno uplatnica", stats.totalPaymentSlips],
      ["Uplatnica po korisniku", stats.totalUsers > 0 ? (stats.totalPaymentSlips / stats.totalUsers).toFixed(1) : "0"],
      [],
      ["Korisnici po roli"],
      ["Rola", "Broj"],
      ["USER", userCount],
      ["ADMIN", adminCount],
      [],
      [`Registracije kroz vrijeme (zadnjih ${periodMonths} mjeseci)`],
      ["Mjesec", "Broj registracija"],
      ...registrationsTimeline.map((p) => [p.label, p.value]),
      [],
      ["Najnovije registracije"],
      ["Ime", "Prezime", "Email", "Registriran"],
      ...recentUsers.map((u) => [u.firstName, u.lastName, u.email, formatDate(u.createdAt)]),
      [],
      ["Uplatnice po kategoriji"],
      ["Kategorija", "Broj uplatnica"],
      ...categoryCounts.map((c) => [c.categoryName, c.count]),
      [],
      ["Uplatnice po potkategoriji"],
      ["Kategorija", "Potkategorija", "Broj uplatnica"],
      ...subCategoryCounts.map((s) => [
        categories.find((c) => c.id === s.categoryId)?.name ?? "",
        s.subCategoryName,
        s.count,
      ]),
    ];
    downloadCsv(`sliptrack-statistika-${new Date().toISOString().slice(0, 10)}.csv`, rowsToCsv(rows));
    showToast("Statistika izvezena u CSV.", "success");
  }

  return (
    <>
      <PageHeader
        title="Statistika"
        subtitle="Pregled sustava — bez pristupa financijskim podacima korisnika."
        actions={
          stats && (
            <button className="btn" onClick={handleExportCsv}>
              Izvoz CSV
            </button>
          )
        }
      />

      {isLoading && <p style={{ color: "var(--text-muted)" }}>Učitavanje...</p>}
      {error && <p className="error-text">{error}</p>}

      {stats && (
        <>
          <div className={styles.statGrid}>
            <StatTile label="Ukupno korisnika" value={stats.totalUsers} />
            <StatTile
              label="Aktivni korisnici"
              value={stats.activeUsers}
              accent="var(--good)"
              subtitle={
                stats.totalUsers > 0
                  ? `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% od ukupnog broja`
                  : undefined
              }
            />
            <StatTile
              label="Neaktivni korisnici"
              value={stats.totalUsers - stats.activeUsers}
              accent="var(--critical)"
            />
            <StatTile label="Ukupno uplatnica" value={stats.totalPaymentSlips} />
            <StatTile
              label="Uplatnica po korisniku"
              value={stats.totalUsers > 0 ? (stats.totalPaymentSlips / stats.totalUsers).toFixed(1) : "0"}
              subtitle="prosjek"
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>Registracije kroz vrijeme</div>
              <select
                className={styles.periodSelect}
                value={periodMonths}
                onChange={(e) => setPeriodMonths(Number(e.target.value))}
              >
                {PERIOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    Zadnjih {m} mjeseci
                  </option>
                ))}
              </select>
            </div>
            <LineChart data={registrationsTimeline} />
          </div>

          <div className={styles.grid}>
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Korisnici po roli</div>
              <BarChart
                data={[
                  { label: "USER", value: userCount },
                  { label: "ADMIN", value: adminCount },
                ]}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Najnovije registracije</div>
              {recentUsers.length === 0 ? (
                <p className={styles.empty}>Nema korisnika.</p>
              ) : (
                <div className={styles.userList}>
                  {recentUsers.map((u) => (
                    <div className={styles.userRow} key={u.id}>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>
                          {u.firstName} {u.lastName}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                      <div className={styles.userDate}>{formatDate(u.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>Uplatnice po kategoriji</div>
              <select
                className={styles.periodSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value={ALL_CATEGORIES}>Sve kategorije</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedCategory && (
              <p className={styles.empty} style={{ marginBottom: 12 }}>
                Ukupno u kategoriji "{selectedCategory.name}": <strong style={{ color: "var(--text-primary)" }}>{selectedCategoryTotal}</strong>
              </p>
            )}
            <BarChart data={categoryBreakdownData} />
          </div>
        </>
      )}
    </>
  );
}
