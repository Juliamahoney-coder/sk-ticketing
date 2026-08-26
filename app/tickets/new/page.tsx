import { TicketPriority } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createTicket } from "../actions";

export default async function NewTicketPage() {
  // requesterId is taken from the session inside the server action, not
  // from anything submitted here — user is only needed for the team default.
  const user = await requireUser();

  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <main style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Neues Ticket</h1>
      <form action={createTicket} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Titel
          <input type="text" name="title" required style={{ width: "100%", padding: 8 }} />
        </label>
        <label>
          Beschreibung
          <textarea name="description" required rows={5} style={{ width: "100%", padding: 8 }} />
        </label>
        <label>
          Team
          <select
            name="teamId"
            required
            defaultValue={user.teamId ?? ""}
            style={{ width: "100%", padding: 8 }}
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
        </label>
        <label>
          Priorität
          <select name="priority" defaultValue={TicketPriority.MEDIUM} style={{ width: "100%", padding: 8 }}>
            {Object.values(TicketPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kategorie
          <input type="text" name="category" required style={{ width: "100%", padding: 8 }} />
        </label>
        <button type="submit" style={{ padding: 8 }}>
          Ticket erstellen
        </button>
      </form>
    </main>
  );
}
