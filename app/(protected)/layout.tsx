import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import styles from "@/app/styles/ui.module.css";
import { SidebarNav } from "./sidebar-nav";
import { SidebarLogoutButton } from "./sidebar-logout-button";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div>
          <Link href="/tickets" className={styles.sidebarBrand}>
            <Image src="/studienkreis-logo.png" alt="Studienkreis" width={168} height={77} priority />
          </Link>
          <span className={styles.sidebarSectionLabel}>Ticket-System</span>
          <SidebarNav />
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.sidebarUserRow}>
            <span className={styles.sidebarUserAvatar}>{initials(user.name ?? user.email ?? "?")}</span>
            <div>
              <div className={styles.sidebarUserName}>{user.name ?? user.email}</div>
              <div className={styles.sidebarUserRole}>{user.role}</div>
            </div>
          </div>
          <SidebarLogoutButton />
        </div>
      </aside>

      <div className={styles.appContent}>{children}</div>
    </div>
  );
}
