"use client";

import { useState } from "react";
import styles from "@/app/styles/ui.module.css";

type PriorityOption = { value: string; label: string };
type TeamOption = { id: string; name: string };

export function EditTicketForm({
  action,
  title,
  priority,
  teamId,
  category,
  teams,
  priorities,
}: {
  action: (formData: FormData) => void;
  title: string;
  priority: string;
  teamId: string;
  category: string;
  teams: TeamOption[];
  priorities: PriorityOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.card}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={styles.collapseToggle}
        aria-expanded={open}
      >
        Ticket bearbeiten
        <i className={open ? "ti ti-chevron-up" : "ti ti-chevron-down"} />
      </button>

      {open && (
        <form action={action} style={{ marginTop: 12 }}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-title">
              Titel
            </label>
            <input
              id="edit-title"
              type="text"
              name="title"
              defaultValue={title}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-priority">
              Priorität
            </label>
            <select id="edit-priority" name="priority" defaultValue={priority} className={styles.select}>
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-teamId">
              Team
            </label>
            <select
              id="edit-teamId"
              name="teamId"
              defaultValue={teamId}
              required
              className={styles.select}
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="edit-category">
              Kategorie
            </label>
            <input
              id="edit-category"
              type="text"
              name="category"
              defaultValue={category}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <button type="submit" className={styles.buttonPrimary}>
              Speichern
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
