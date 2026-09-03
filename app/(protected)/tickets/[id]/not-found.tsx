import Link from "next/link";
import styles from "@/app/styles/ui.module.css";

export default function TicketNotFound() {
  return (
    <main className={styles.page} style={{ maxWidth: 1120 }}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/tickets">Tickets</Link> › Ticket nicht gefunden
          </span>
          <h1 className={styles.pageTitle}>Ticket nicht gefunden</h1>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
        <div className={styles.card} style={{ maxWidth: 480, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <i className="ti ti-search-off" style={{ fontSize: 40, color: "var(--sk-text-primary)" }} />
          <h2 className={styles.cardTitle} style={{ fontSize: 18 }}>Dieses Ticket ist nicht verfügbar.</h2>
          <p className={styles.pageSub}>
            Prüfe die Adresse oder gehe zurück zur Übersicht. Bei Fragen wendest du dich an den
            IT-Support.
          </p>
          <Link href="/tickets" className={styles.buttonPrimary}>
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    </main>
  );
}
