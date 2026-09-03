import Link from "next/link";
import { notFound } from "next/navigation";
import { Role, TicketPriority, TicketStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getVisibleTicketById } from "@/lib/tickets";
import { getVisibleComments } from "@/lib/comments";
import { getSignedAttachmentUrl } from "@/lib/attachments";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  priorityVariant,
  statusBadgeVariant,
} from "@/lib/ticket-display";
import styles from "@/app/styles/ui.module.css";
import { updateTicketFields, updateTicketStatus } from "../actions";
import { createComment, updateComment } from "../comment-actions";
import { EditTicketForm } from "./edit-ticket-form";
import { CommentsSection, type CommentItem } from "./comments-section";

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

  const canEdit = user.role === Role.AGENT || user.role === Role.ADMIN;
  const updateStatusForTicket = updateTicketStatus.bind(null, ticket.id);
  const updateFieldsForTicket = updateTicketFields.bind(null, ticket.id);
  const createCommentForTicket = createComment.bind(null, ticket.id);
  const teams = canEdit ? await prisma.team.findMany({ orderBy: { name: "asc" } }) : [];

  const rawComments = (await getVisibleComments(user, ticket.id)) ?? [];
  const comments: CommentItem[] = await Promise.all(
    rawComments.map(async (comment) => ({
      id: comment.id,
      body: comment.body,
      visibility: comment.visibility,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      authorName: comment.author.name,
      authorRole: comment.author.role,
      attachments: await Promise.all(
        comment.attachments.map(async (attachment) => ({
          id: attachment.id,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          signedUrl: await getSignedAttachmentUrl(attachment.fileUrl),
        }))
      ),
    }))
  );

  return (
    <main className={styles.page} style={{ maxWidth: 1120 }}>
      <div className={styles.pageHeader} style={{ alignItems: "flex-start" }}>
        <div>
          <span className={styles.breadcrumb}>
            <Link href="/tickets">Tickets</Link> › #{ticket.id.slice(-4)}
          </span>
          <h1 className={styles.pageTitle}>{ticket.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span className={`${styles.badge} ${styles[statusBadgeVariant(ticket.status)]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className={`${styles.badge} ${styles.badgeNeutral}`}>{ticket.team.name}</span>
            <span className={styles[priorityVariant(ticket.priority)]}>
              <span className={styles.priorityDot} />
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: canEdit ? "1.6fr 1fr" : "1fr", gap: 20 }}>
        <div className={styles.cardStack}>
          <div className={styles.card}>
            <p className={styles.note}>
              <i className="ti ti-lock" />
              Beschreibung · nicht editierbar
            </p>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
              {ticket.description}
            </p>

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Status</span>
                <span className={`${styles.badge} ${styles[statusBadgeVariant(ticket.status)]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Priorität</span>
                <span className={styles[priorityVariant(ticket.priority)]}>
                  <span className={styles.priorityDot} />
                  {PRIORITY_LABELS[ticket.priority]}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Team</span>
                <span className={`${styles.badge} ${styles.badgeNeutral}`}>{ticket.team.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Kategorie</span>
                <span className={styles.infoValue}>{ticket.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ersteller</span>
                <span className={styles.infoValue}>{ticket.requester.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Bearbeiter</span>
                <span className={styles.infoValue}>{ticket.owner?.name ?? "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Erstellt</span>
                <span className={styles.infoValue}>{ticket.createdAt.toLocaleString("de-DE")}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Geschlossen</span>
                <span className={styles.infoValue}>
                  {ticket.closedAt ? ticket.closedAt.toLocaleString("de-DE") : "—"}
                </span>
              </div>
            </div>
          </div>

          <CommentsSection
            comments={comments}
            currentUserId={user.id}
            canChooseVisibility={user.role !== Role.REQUESTER}
            createAction={createCommentForTicket}
            updateAction={updateComment}
          />
        </div>

        {canEdit && (
          <div className={styles.cardStack}>
            <EditTicketForm
              action={updateFieldsForTicket}
              title={ticket.title}
              priority={ticket.priority}
              teamId={ticket.teamId}
              category={ticket.category}
              teams={teams}
              priorities={Object.values(TicketPriority).map((value) => ({
                value,
                label: PRIORITY_LABELS[value],
              }))}
            />

            <div className={styles.card}>
              <p className={styles.label}>Status ändern</p>
              <form
                action={updateStatusForTicket}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <select name="status" defaultValue={ticket.status} className={styles.select}>
                  {Object.values(TicketStatus).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <button type="submit" className={styles.buttonSecondary} style={{ width: "100%" }}>
                  Status aktualisieren
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
