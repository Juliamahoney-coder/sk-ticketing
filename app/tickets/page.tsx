import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getVisibleTickets } from "@/lib/tickets";

export default async function TicketsPage() {
  const user = await requireUser();
  const tickets = await getVisibleTickets(user);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Tickets</h1>
        <Link href="/tickets/new">+ Neues Ticket</Link>
      </div>

      {tickets.length === 0 ? (
        <p>Keine Tickets sichtbar.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th style={{ padding: 8 }}>Titel</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Priorität</th>
              <th style={{ padding: 8 }}>Team</th>
              <th style={{ padding: 8 }}>Erstellt am</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <Link href={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                </td>
                <td style={{ padding: 8 }}>{ticket.status}</td>
                <td style={{ padding: 8 }}>{ticket.priority}</td>
                <td style={{ padding: 8 }}>{ticket.team.name}</td>
                <td style={{ padding: 8 }}>
                  {ticket.createdAt.toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
