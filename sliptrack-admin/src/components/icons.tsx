// Hand-built, angular line icons (square joins/caps, no rounded shapes) —
// deliberately not a generic icon-library set, to match the sharp-edged theme.
import type { SVGProps } from "react";

function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...props}
    />
  );
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="8" height="12" />
      <rect x="13" y="3" width="8" height="6" />
      <rect x="13" y="11" width="8" height="10" />
      <rect x="3" y="17" width="8" height="4" />
    </Base>
  );
}

export function CategoriesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="4" />
      <rect x="3" y="10" width="14" height="4" />
      <rect x="3" y="16" width="10" height="4" />
    </Base>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="6" height="6" />
      <path d="M2 21v-3l4-4h2l4 4v3" />
      <rect x="15" y="7" width="5" height="5" />
      <path d="M13.5 21v-2.5l3-3h1.5l3 3V21" />
    </Base>
  );
}

export function StatsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 21V9" />
      <path d="M10 21V3" />
      <path d="M17 21V13" />
      <rect x="9" y="2" width="2" height="2" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M10 4H4v16h6" />
      <path d="M14 8l5 4-5 4" />
      <path d="M19 12H9" />
    </Base>
  );
}

export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 20h4l11-11-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </Base>
  );
}

export function DeleteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Base>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </Base>
  );
}

export function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M6 4l8 8-8 8" />
    </Base>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Base>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M5 5l14 14" />
      <path d="M19 5L5 19" />
    </Base>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="6" height="6" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.5 4.5l2 2" />
      <path d="M17.5 17.5l2 2" />
      <path d="M19.5 4.5l-2 2" />
      <path d="M6.5 17.5l-2 2" />
    </Base>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
    </Base>
  );
}

export function SortIcon({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
      <polygon points="4.5,0 9,5 0,5" fill={direction === "asc" ? "var(--accent)" : "var(--border-strong)"} />
      <polygon points="4.5,12 9,7 0,7" fill={direction === "desc" ? "var(--accent)" : "var(--border-strong)"} />
    </svg>
  );
}
