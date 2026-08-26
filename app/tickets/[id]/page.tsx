import { notFound } from "next/navigation";
import { Role, TicketStatus } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/session";
import { getVisibleTicketById } from "@/lib/tickets";
import { updateTicketStatus } from "../actions";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const ticket = await getVisibleTicketById(user, id);

  // Same response whether the ticket does not exist or the user just has
  // no access to it — avoids leaking which ticket ids exist.
  if (!ticket) {
    notFound();
  }

  const canChangeStatus = user.role === Role.AGENT || user.role === Role.ADMIN;
  const updateStatusForTicket = updateTicketStatus.bind(null, ticket.id);

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>{ticket.title}</h1>

      <dl>
        <dt>Status</dt>
        <dd>{ticket.status}</dd>
        <dt>Priorität</dt>
        <dd>{ticket.priority}</dd>
        <dt>Team</dt>
        <dd>{ticket.team.name}</dd>
        <dt>Kategorie</dt>
        <dd>{ticket.category}</dd>
        <dt>Ersteller</dt>
        <dd>{ticket.requester.name}</dd>
        <dt>Bearbeiter</dt>
        <dd>{ticket.owner?.name ?? "—"}</dd>
        <dt>Erstellt am</dt>
        <dd>{ticket.createdAt.toLocaleString("de-DE")}</dd>
        {ticket.closedAt && (
          <>
            <dt>Geschlossen am</dt>
            <dd>{ticket.closedAt.toLocaleString("de-DE")}</dd>
          </>
        )}
      </dl>

      <h2>Beschreibung</h2>
      {/* Read-only by design — description must not be editable after creation */}
      <p style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>

      {canChangeStatus && (
        <form action={updateStatusForTicket} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 24 }}>
          <label>
            Status ändern
            <select name="status" defaultValue={ticket.status} style={{ marginLeft: 8, padding: 6 }}>
              {Object.values(TicketStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" style={{ padding: 6 }}>
            Aktualisieren
          </button>
        </form>
      )}
    </main>
  );
}
