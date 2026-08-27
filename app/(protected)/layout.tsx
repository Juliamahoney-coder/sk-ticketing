import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import styles from "@/app/styles/ui.module.css";
import { SidebarLogoutButton } from "./sidebar-logout-button";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div>
          <Link href="/tickets" className={styles.sidebarBrand}>
            SK Ticketing
          </Link>
          <nav className={styles.sidebarNav}>
            <Link href="/tickets" className={styles.sidebarNavItem}>
              <i className="ti ti-ticket" /> Tickets
            </Link>
            <Link href="/tickets/new" className={styles.sidebarNavButton}>
              <i className="ti ti-plus" /> Neues Ticket
            </Link>
          </nav>
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.sidebarUserName}>{user.name ?? user.email}</div>
          <div className={styles.sidebarUserRole}>{user.role}</div>
          <SidebarLogoutButton />
        </div>
      </aside>

      <div className={styles.appContent}>{children}</div>
    </div>
  );
}
