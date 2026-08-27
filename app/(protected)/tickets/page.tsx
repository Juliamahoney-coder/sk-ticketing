import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getVisibleTickets } from "@/lib/tickets";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  priorityVariant,
  statusBadgeVariant,
} from "@/lib/ticket-display";
import styles from "@/app/styles/ui.module.css";

const COLUMNS = "1.8fr 110px 100px 120px 150px";

export default async function TicketsPage() {
  const user = await requireUser();
  const tickets = await getVisibleTickets(user);

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Tickets</h1>
          <p className={styles.pageSub}>{tickets.length} sichtbar</p>
        </div>
        <Link href="/tickets/new" className={styles.buttonPrimary}>
          + Neues Ticket
        </Link>
      </div>

      <div className={styles.wrap}>
        {tickets.length === 0 ? (
          <p className={styles.emptyState}>Keine Tickets sichtbar.</p>
        ) : (
          <>
            <div className={styles.tableHeaderRow} style={{ gridTemplateColumns: COLUMNS }}>
              <div>Titel</div>
              <div>Status</div>
              <div>Priorität</div>
              <div>Team</div>
              <div>Erstellt am</div>
            </div>
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className={styles.row}
                style={{ gridTemplateColumns: COLUMNS }}
              >
                <div className={styles.rowTitle}>{ticket.title}</div>
                <div>
                  <span className={`${styles.badge} ${styles[statusBadgeVariant(ticket.status)]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <div className={styles[priorityVariant(ticket.priority)]}>
                  {PRIORITY_LABELS[ticket.priority]}
                </div>
                <div>
                  <span className={`${styles.badge} ${styles.badgeNeutral}`}>{ticket.team.name}</span>
                </div>
                <div className={styles.metaText}>{ticket.createdAt.toLocaleString("de-DE")}</div>
              </Link>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
