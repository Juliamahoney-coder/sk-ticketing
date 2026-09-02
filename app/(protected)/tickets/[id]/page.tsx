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
    <main className={styles.page} style={{ maxWidth: 860 }}>
      <div className={styles.pageHeader} style={{ alignItems: "flex-start" }}>
        <div>
          <p className={styles.metaText} style={{ fontSize: 11 }}>
            Ticket
          </p>
          <h1 className={styles.pageTitle}>{ticket.title}</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className={styles.cardStack}>
          <div className={styles.card}>
            <p className={styles.note}>
              <i className="ti ti-lock" />
              Beschreibung · nicht editierbar
            </p>
            <p style={{ whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5 }}>
              {ticket.description}
            </p>
          </div>

          {canEdit && (
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
          )}

          {canEdit && (
            <div className={styles.card}>
              <p className={styles.label}>Status ändern</p>
              <form
                action={updateStatusForTicket}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <select name="status" defaultValue={ticket.status} className={styles.select}>
                  {Object.values(TicketStatus).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <button type="submit" className={styles.buttonPrimary}>
                  Aktualisieren
                </button>
              </form>
            </div>
          )}

          <CommentsSection
            comments={comments}
            currentUserId={user.id}
            canChooseVisibility={user.role !== Role.REQUESTER}
            createAction={createCommentForTicket}
            updateAction={updateComment}
          />
        </div>

        <div className={styles.card}>
          <p className={styles.label} style={{ marginBottom: 8 }}>
            Ticket-Info
          </p>
          <table className={styles.infoTable}>
            <tbody>
              <tr>
                <td className={styles.infoLabel}>Status</td>
                <td className={styles.infoValue}>
                  <span className={`${styles.badge} ${styles[statusBadgeVariant(ticket.status)]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </td>
              </tr>
              <tr>
                <td className={styles.infoLabel}>Priorität</td>
                <td className={`${styles.infoValue} ${styles[priorityVariant(ticket.priority)]}`}>
                  {PRIORITY_LABELS[ticket.priority]}
                </td>
              </tr>
              <tr>
                <td className={styles.infoLabel}>Team</td>
                <td className={styles.infoValue}>
                  <span className={`${styles.badge} ${styles.badgeNeutral}`}>{ticket.team.name}</span>
                </td>
              </tr>
              <tr>
                <td className={styles.infoLabel}>Kategorie</td>
                <td className={styles.infoValue}>{ticket.category}</td>
              </tr>
              <tr>
                <td className={styles.infoLabel}>Ersteller</td>
                <td className={styles.infoValue}>{ticket.requester.name}</td>
              </tr>
              <tr>
                <td className={styles.infoLabel}>Bearbeiter</td>
                <td className={styles.infoValue}>{ticket.owner?.name ?? "—"}</td>
              </tr>
              <tr>
                <td className={styles.infoLabel}>Erstellt am</td>
                <td className={`${styles.infoValue} ${styles.metaText}`}>
                  {ticket.createdAt.toLocaleString("de-DE")}
                </td>
              </tr>
              {ticket.closedAt && (
                <tr>
                  <td className={styles.infoLabel}>Geschlossen am</td>
                  <td className={`${styles.infoValue} ${styles.metaText}`}>
                    {ticket.closedAt.toLocaleString("de-DE")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
