import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  CategoriesIcon,
  CloseIcon,
  DashboardIcon,
  LogoutIcon,
  MoonIcon,
  StatsIcon,
  SunIcon,
  UsersIcon,
} from "./icons";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { to: "/", label: "Pregled", icon: DashboardIcon, end: true },
  { to: "/categories", label: "Kategorije", icon: CategoriesIcon, end: false },
  { to: "/users", label: "Korisnici", icon: UsersIcon, end: false },
  { to: "/stats", label: "Statistika", icon: StatsIcon, end: false },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={isOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          SLIP<span>TRACK</span> / ADMIN
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Zatvori izbornik">
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userEmail}>{user?.email}</div>
        <button className={styles.themeBtn} onClick={toggleTheme}>
          {theme === "dark" ? <SunIcon width={14} height={14} /> : <MoonIcon width={14} height={14} />}
          {theme === "dark" ? "Svijetla tema" : "Tamna tema"}
        </button>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogoutIcon width={14} height={14} />
          Odjava
        </button>
      </div>
    </aside>
  );
}
