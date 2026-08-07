import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/AdminLayout";
import { adminApi } from "../api/adminApi";
import { extractErrorMessage } from "../api/errors";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { formatDate } from "../utils/formatDate";
import { downloadCsv, rowsToCsv } from "../utils/csv";
import { SortIcon } from "../components/icons";
import type { AdminUser } from "../types/admin";
import styles from "./UsersPage.module.css";

type RoleFilter = "ALL" | "ADMIN" | "USER";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type SortKey = "name" | "role" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const SORT_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Korisnik" },
  { key: "role", label: "Rola" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Registriran" },
];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Korisnici se nisu mogli učitati"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleActive(targetUser: AdminUser) {
    if (targetUser.active) {
      const ok = await confirm(`Deaktivirati račun korisnika ${targetUser.firstName} ${targetUser.lastName}?`, {
        title: "Deaktiviraj korisnika",
        confirmLabel: "Deaktiviraj",
        danger: true,
      });
      if (!ok) return;
    }

    setPendingId(targetUser.id);
    try {
      const updated = targetUser.active
        ? await adminApi.deactivate(targetUser.id)
        : await adminApi.activate(targetUser.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast(
        updated.active ? `${updated.firstName} ${updated.lastName} aktiviran/a.` : `${updated.firstName} ${updated.lastName} deaktiviran/a.`,
        "success",
      );
    } catch (err) {
      showToast(extractErrorMessage(err));
    } finally {
      setPendingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter === "ACTIVE" && !u.active) return false;
      if (statusFilter === "INACTIVE" && u.active) return false;
      if (!q) return true;
      const haystack = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "hr");
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "status":
          cmp = Number(a.active) - Number(b.active);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredUsers, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function handleExportCsv() {
    const rows: (string | number)[][] = [
      ["Ime", "Prezime", "Email", "Rola", "Status", "Registriran"],
      ...sortedUsers.map((u) => [
        u.firstName,
        u.lastName,
        u.email,
        u.role,
        u.active ? "Aktivan" : "Deaktiviran",
        formatDate(u.createdAt),
      ]),
    ];
    downloadCsv(`sliptrack-korisnici-${new Date().toISOString().slice(0, 10)}.csv`, rowsToCsv(rows));
    showToast(`Izvezeno ${sortedUsers.length} korisnika u CSV.`, "success");
  }

  return (
    <>
      <PageHeader
        title="Korisnici"
        subtitle="Pregled registriranih korisnika i upravljanje računima."
        actions={
          users.length > 0 && (
            <button className="btn" onClick={handleExportCsv}>
              Izvoz CSV
            </button>
          )
        }
      />

      {isLoading && <p style={{ color: "var(--text-muted)" }}>Učitavanje...</p>}
      {error && <p className="error-text">{error}</p>}

      {!isLoading && !error && users.length === 0 && (
        <div className={styles.emptyState}>Nema registriranih korisnika.</div>
      )}

      {!isLoading && users.length > 0 && (
        <>
          <div className="toolbar">
            <input
              type="search"
              placeholder="Pretraži po imenu ili emailu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}>
              <option value="ALL">Sve role</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="ALL">Svi statusi</option>
              <option value="ACTIVE">Aktivni</option>
              <option value="INACTIVE">Deaktivirani</option>
            </select>
            <span className="resultCount">
              {filteredUsers.length} / {users.length}
            </span>
          </div>

          {sortedUsers.length === 0 ? (
            <div className={styles.emptyState}>Nema korisnika koji odgovaraju pretrazi.</div>
          ) : (
            <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {SORT_COLUMNS.map((col) => (
                    <th key={col.key}>
                      <button className={styles.sortBtn} onClick={() => handleSort(col.key)}>
                        {col.label}
                        <SortIcon direction={sortKey === col.key ? sortDirection : null} />
                      </button>
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => {
                  const isSelf = u.email === currentUser?.email;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className={styles.name}>
                          {u.firstName} {u.lastName}
                        </div>
                        <div className={styles.email}>{u.email}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${u.role === "ADMIN" ? styles.badgeAdmin : ""}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${u.active ? styles.badgeActive : styles.badgeInactive}`}>
                          {u.active ? "Aktivan" : "Deaktiviran"}
                        </span>
                      </td>
                      <td className={styles.date}>{formatDate(u.createdAt)}</td>
                      <td className={styles.actionCell}>
                        <button
                          className="btn"
                          disabled={isSelf || pendingId === u.id}
                          title={isSelf ? "Ne možeš deaktivirati vlastiti račun" : undefined}
                          onClick={() => handleToggleActive(u)}
                        >
                          {pendingId === u.id ? "..." : u.active ? "Deaktiviraj" : "Aktiviraj"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
