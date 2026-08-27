"use client";

import { signOut } from "next-auth/react";
import styles from "@/app/styles/ui.module.css";

export function SidebarLogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={styles.sidebarLogout}
    >
      Logout
    </button>
  );
}
