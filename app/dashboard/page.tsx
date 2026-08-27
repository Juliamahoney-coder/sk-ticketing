import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import styles from "@/app/styles/ui.module.css";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main className={styles.page} style={{ maxWidth: 480, marginTop: 80 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      <div className={styles.card}>
        <table className={styles.infoTable}>
          <tbody>
            <tr>
              <td className={styles.infoLabel}>Eingeloggt als</td>
              <td className={styles.infoValue}>{session.user.email}</td>
            </tr>
            <tr>
              <td className={styles.infoLabel}>Rolle</td>
              <td className={styles.infoValue}>
                <span className={`${styles.badge} ${styles.badgeNeutral}`}>{session.user.role}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
