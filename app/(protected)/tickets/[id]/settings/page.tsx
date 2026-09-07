import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canEditTicket, getVisibleTicketById } from "@/lib/tickets";
import styles from "@/app/styles/ui.module.css";
import { assignTicketToUser, updateTicketFollowers } from "../../actions";

export default async function TicketSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const ticket = await getVisibleTicketById(user, id);

  // Same 404-for-both-cases treatment as the ticket page itself. On top of
  // that, being able to see the ticket (e.g. a cross-team follower) is not
  // enough to reach settings — only canEditTicket gets in.
  if (!ticket || !canEditTicket(user, ticket)) {
    notFound();
  }

  const assignToUserForTicket = assignTicketToUser.bind(null, ticket.id);
  const updateFollowersForTicket = updateTicketFollowers.bind(null, ticket.id);

  // Owner candidates: ADMIN, or an AGENT on this ticket's own team — see
  // the doc comment on assignTicketToUser for why this is narrower than
  // the follower candidates below.
  const ownerCandidates = await prisma.user.findMany({
    where: { OR: [{ role: Role.ADMIN }, { role: Role.AGENT, teamId: ticket.teamId }] },
    orderBy: { name: "asc" },
  });

  // Follower candidates: any AGENT/ADMIN, teamless by design (point 2 of
  // the original spec) — re-validated with the same filter server-side in
  // updateTicketFollowers.
  const followerCandidates = await prisma.user.findMany({
    where: { role: { in: [Role.AGENT, Role.ADMIN] } },
    orderBy: { name: "asc" },
  });

  const followerIds = ticket.followers.map((f) => f.userId);

  return (
    <main className={styles.page} style={{ maxWidth: 640 }}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/tickets">Tickets</Link> ›{" "}
            <Link href={`/tickets/${ticket.id}`}>{ticket.title}</Link> › Verwalten
          </span>
          <h1 className={styles.pageTitle}>Zuweisung verwalten</h1>
        </div>
      </div>

      <div className={styles.cardStack}>
        <form action={assignToUserForTicket} className={styles.card}>
          <p className={styles.label}>Bearbeiter</p>
          <select name="ownerId" defaultValue={ticket.ownerId ?? ""} className={styles.select}>
            <option value="">— Kein Bearbeiter —</option>
            {ownerCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.buttonPrimary} style={{ width: "100%", marginTop: 12 }}>
            Speichern
          </button>
        </form>

        <form action={updateFollowersForTicket} className={styles.card}>
          <p className={styles.label}>Mitbearbeiter</p>
          <select
            name="followerIds"
            multiple
            defaultValue={followerIds}
            className={styles.select}
            style={{ minHeight: 140 }}
          >
            {followerCandidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.buttonSecondary} style={{ width: "100%", marginTop: 12 }}>
            Übernehmen
          </button>
        </form>
      </div>
    </main>
  );
}
