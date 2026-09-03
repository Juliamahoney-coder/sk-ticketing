"use client";

import { useState } from "react";
import type { Role } from "@/app/generated/prisma/client";
import styles from "@/app/styles/ui.module.css";

type Visibility = "INTERNAL" | "EXTERNAL";
type ComposerTab = "antwort" | "notiz";

type CommentAttachment = {
  id: string;
  fileName: string;
  fileSize: number;
  signedUrl: string | null;
};

export type CommentItem = {
  id: string;
  body: string;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
  authorRole: Role;
  attachments: CommentAttachment[];
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  ADMIN: styles.badgeAccent,
  AGENT: styles.badgeDark,
  REQUESTER: styles.badgeNeutral,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CommentAttachmentLink({ attachment }: { attachment: CommentAttachment }) {
  const label = `${attachment.fileName} (${formatFileSize(attachment.fileSize)})`;

  if (!attachment.signedUrl) {
    return (
      <span className={styles.commentAttachment}>
        <i className="ti ti-paperclip" /> {label} — Vorschau nicht verfügbar
      </span>
    );
  }

  return (
    <a
      href={attachment.signedUrl}
      target="_blank"
      rel="noreferrer"
      className={styles.commentAttachment}
    >
      <i className="ti ti-paperclip" /> {label}
    </a>
  );
}

function CommentListItem({
  comment,
  isOwn,
  updateAction,
}: {
  comment: CommentItem;
  isOwn: boolean;
  updateAction: (commentId: string, formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const edited = comment.updatedAt.getTime() !== comment.createdAt.getTime();
  const boundUpdate = updateAction.bind(null, comment.id);

  // Internal always gets the blue tint, regardless of author — "own" only
  // shades an external entry, so an agent's own internal note still reads
  // as internal rather than blending in as a personal comment.
  const itemClass =
    comment.visibility === "INTERNAL"
      ? styles.commentItemInternal
      : isOwn
        ? styles.commentItemOwn
        : styles.commentItem;

  const avatarClass =
    comment.authorRole === "ADMIN"
      ? styles.commentAvatarAdmin
      : comment.authorRole === "AGENT"
        ? styles.commentAvatarAgent
        : styles.commentAvatar;

  return (
    <div className={itemClass}>
      <span className={avatarClass}>{initials(comment.authorName)}</span>
      <div className={styles.commentBodyWrap}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.authorName}</span>
          <span className={`${styles.badge} ${ROLE_BADGE_CLASS[comment.authorRole]}`}>
            {comment.authorRole}
          </span>
          {comment.visibility === "INTERNAL" && (
            <span className={`${styles.badge} ${styles.badgeAccent}`}>Interne Notiz</span>
          )}
          <span>{comment.createdAt.toLocaleString("de-DE")}</span>
          {edited && <span>· bearbeitet</span>}
          {isOwn && !editing && (
            <button type="button" className={styles.commentEditToggle} onClick={() => setEditing(true)}>
              Bearbeiten
            </button>
          )}
        </div>

        {editing ? (
          <form action={boundUpdate}>
            <textarea
              name="body"
              defaultValue={comment.body}
              required
              rows={3}
              className={styles.textarea}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="submit" className={`${styles.buttonPrimary} ${styles.buttonSm}`}>
                Speichern
              </button>
              <button
                type="button"
                className={`${styles.buttonGhost} ${styles.buttonSm}`}
                onClick={() => setEditing(false)}
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className={styles.commentBody}>{comment.body}</p>
            {comment.attachments.length > 0 && (
              <div className={styles.commentAttachments}>
                {comment.attachments.map((attachment) => (
                  <CommentAttachmentLink key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NewCommentForm({
  canChooseVisibility,
  createAction,
}: {
  canChooseVisibility: boolean;
  createAction: (formData: FormData) => void;
}) {
  const [tab, setTab] = useState<ComposerTab>("antwort");
  const visibility: Visibility = tab === "notiz" ? "INTERNAL" : "EXTERNAL";

  const placeholder =
    !canChooseVisibility
      ? "Nachricht an das bearbeitende Team …"
      : tab === "notiz"
        ? "Interne Notiz für dein Team …"
        : "Antwort an den Ersteller …";

  const hint = tab === "notiz" ? "Nur für AGENT und ADMIN sichtbar" : "Sichtbar für Ersteller und Team";

  return (
    <form action={createAction} style={{ borderTop: "1px solid var(--sk-border-light)", paddingTop: 16, marginTop: 4 }}>
      {canChooseVisibility ? (
        <div className={styles.commentTabs} style={{ marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setTab("antwort")}
            className={`${styles.commentTab} ${tab === "antwort" ? styles.commentTabActive : ""}`}
          >
            Antwort
          </button>
          <button
            type="button"
            onClick={() => setTab("notiz")}
            className={`${styles.commentTab} ${tab === "notiz" ? styles.commentTabActive : ""}`}
          >
            Interne Notiz
          </button>
        </div>
      ) : (
        <label className={styles.label} htmlFor="comment-body">
          Antwort
        </label>
      )}

      <div className={styles.field}>
        <textarea
          id="comment-body"
          name="body"
          placeholder={placeholder}
          required
          rows={3}
          className={styles.textarea}
        />
      </div>

      {canChooseVisibility && <input type="hidden" name="visibility" value={visibility} />}

      <div
        className={styles.field}
        style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "1px dashed var(--sk-border-default)",
            borderRadius: "var(--sk-radius-sm)",
            padding: "9px 14px",
            fontSize: 13,
            color: "var(--sk-text-secondary)",
            cursor: "pointer",
          }}
        >
          <i className="ti ti-paperclip" /> Datei anhängen (max. 10 MB)
          <input type="file" name="file" style={{ display: "none" }} />
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canChooseVisibility && <span className={styles.metaText} style={{ fontSize: 11 }}>{hint}</span>}
          <button type="submit" className={styles.buttonPrimary}>
            Kommentar senden
          </button>
        </div>
      </div>
    </form>
  );
}

export function CommentsSection({
  comments,
  currentUserId,
  canChooseVisibility,
  createAction,
  updateAction,
}: {
  comments: CommentItem[];
  currentUserId: string;
  canChooseVisibility: boolean;
  createAction: (formData: FormData) => void;
  updateAction: (commentId: string, formData: FormData) => void;
}) {
  return (
    <div className={styles.card}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <h2 className={styles.cardTitle}>Verlauf</h2>
        <span className={styles.metaText} style={{ fontSize: 11 }}>
          {comments.length} {comments.length === 1 ? "Eintrag" : "Einträge"} · älteste zuerst
        </span>
      </div>

      {canChooseVisibility && (
        <p className={styles.commentVisibilityNoteInternal}>
          <i className="ti ti-lock" /> Interne Notizen stehen im gleichen Verlauf, sind aber nur für
          AGENT und ADMIN sichtbar.
        </p>
      )}

      <div className={styles.commentList}>
        {comments.length === 0 ? (
          <div className={styles.historyEmpty}>
            <span className={styles.commentAuthor}>Noch keine Einträge.</span>
            <span className={styles.metaText}>Schreib die erste Nachricht zu diesem Ticket.</span>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentListItem
              key={comment.id}
              comment={comment}
              isOwn={comment.authorId === currentUserId}
              updateAction={updateAction}
            />
          ))
        )}
      </div>

      <NewCommentForm canChooseVisibility={canChooseVisibility} createAction={createAction} />
    </div>
  );
}
