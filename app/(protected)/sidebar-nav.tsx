"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/styles/ui.module.css";

const NAV_ITEMS = [
  { href: "/tickets", label: "Tickets", icon: "ti ti-ticket" },
  { href: "/tickets/new", label: "Neues Ticket", icon: "ti ti-plus" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebarNav}>
      {NAV_ITEMS.map((item) => {
        // /tickets/new is the only sub-route with its own nav entry — every
        // other /tickets/* path (e.g. a ticket detail page) still counts as
        // the "Tickets" item being active.
        const isActive =
          item.href === "/tickets/new"
            ? pathname === "/tickets/new"
            : pathname === "/tickets" || (pathname?.startsWith("/tickets/") && pathname !== "/tickets/new");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? styles.sidebarNavItemActive : styles.sidebarNavItem}
          >
            <i className={item.icon} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
