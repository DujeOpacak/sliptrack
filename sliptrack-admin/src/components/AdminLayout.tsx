import { useState } from "react";
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MenuIcon } from "./icons";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <Sidebar isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      {isMobileNavOpen && (
        <div className={styles.backdrop} onClick={() => setIsMobileNavOpen(false)} />
      )}
      <main className={styles.content}>
        <header className={styles.mobileTopBar}>
          <button
            className={styles.menuBtn}
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Otvori izbornik"
          >
            <MenuIcon width={20} height={20} />
          </button>
          <span className={styles.mobileBrand}>
            SLIP<span>TRACK</span>
          </span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
