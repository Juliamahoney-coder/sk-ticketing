import { TicketPriority } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PRIORITY_LABELS } from "@/lib/ticket-display";
import styles from "@/app/styles/ui.module.css";
import { createTicket } from "../actions";

export default async function NewTicketPage() {
  // requesterId is taken from the session inside the server action, not
  // from anything submitted here — user is only needed for the team default.
  const user = await requireUser();

  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <main className={styles.page} style={{ maxWidth: 560 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Neues Ticket</h1>
      </div>

      <div className={styles.card}>
        <form action={createTicket}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">
              Titel
            </label>
            <input id="title" type="text" name="title" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Beschreibung
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              className={styles.textarea}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="teamId">
              Team
            </label>
            <select
              id="teamId"
              name="teamId"
              required
              defaultValue={user.teamId ?? ""}
              className={styles.select}
            >
              <option value="" disabled>
                Bitte wählen
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="priority">
              Priorität
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue={TicketPriority.MEDIUM}
              className={styles.select}
            >
              {Object.values(TicketPriority).map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="category">
              Kategorie
            </label>
            <input id="category" type="text" name="category" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <button type="submit" className={styles.buttonPrimary} style={{ width: "100%" }}>
              Ticket erstellen
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
