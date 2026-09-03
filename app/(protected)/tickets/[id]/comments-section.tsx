"use client";

import { useState } from "react";
import styles from "@/app/styles/ui.module.css";

type Visibility = "INTERNAL" | "EXTERNAL";

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
  attachments: CommentAttachment[];
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

  const itemClass = isOwn
    ? styles.commentItemOwn
    : comment.visibility === "INTERNAL"
      ? styles.commentItemInternal
      : styles.commentItem;

  return (
    <div className={itemClass}>
      <span className={styles.commentAvatar}>{initials(comment.authorName)}</span>
      <div className={styles.commentBodyWrap}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.authorName}</span>
          {isOwn && (
            <span className={`${styles.badge} ${styles.badgeDark}`}>Dein Kommentar</span>
          )}
          {!isOwn && comment.visibility === "INTERNAL" && (
            <span className={`${styles.badge} ${styles.badgeAccent}`}>Intern</span>
          )}
          <span>{comment.createdAt.toLocaleString("de-DE")}</span>
          {edited && <span>· bearbeitet</span>}
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
            {isOwn && (
              <button type="button" className={styles.commentEditToggle} onClick={() => setEditing(true)}>
                Bearbeiten
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NewCommentForm({
  visibility,
  canChooseVisibility,
  createAction,
}: {
  visibility: Visibility;
  canChooseVisibility: boolean;
  createAction: (formData: FormData) => void;
}) {
  return (
    <form action={createAction} style={{ borderTop: "1px solid var(--sk-border-light)", paddingTop: 16, marginTop: 4 }}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="comment-body">
          Neuer Kommentar
        </label>
        <textarea
          id="comment-body"
          name="body"
          placeholder="Antwort an den Ersteller oder interne Notiz …"
          required
          rows={3}
          className={styles.textarea}
        />
      </div>
      <div
        className={styles.field}
        style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
      >
        <input type="file" name="file" className={styles.input} style={{ flex: 1, minWidth: 200 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {canChooseVisibility && (
            <select name="visibility" defaultValue={visibility} className={styles.select} style={{ width: 140 }}>
              <option value="INTERNAL">Intern</option>
              <option value="EXTERNAL">Extern</option>
            </select>
          )}
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
  const [activeTab, setActiveTab] = useState<Visibility>(canChooseVisibility ? "INTERNAL" : "EXTERNAL");

  // REQUESTER only ever receives EXTERNAL comments from the server, so
  // no client-side filtering happens for them — this is just choosing
  // which subset of an already-authorized list to display.
  const visibleComments = canChooseVisibility
    ? comments.filter((c) => c.visibility === activeTab)
    : comments;

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <h2 className={styles.cardTitle}>Kommentare</h2>
        {canChooseVisibility && (
          <div className={styles.commentTabs}>
            <button
              type="button"
              onClick={() => setActiveTab("INTERNAL")}
              className={`${styles.commentTab} ${activeTab === "INTERNAL" ? styles.commentTabInternalActive : ""}`}
            >
              Intern
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("EXTERNAL")}
              className={`${styles.commentTab} ${activeTab === "EXTERNAL" ? styles.commentTabExternalActive : ""}`}
            >
              Extern
            </button>
          </div>
        )}
      </div>

      {canChooseVisibility && (
        <p
          className={
            activeTab === "INTERNAL"
              ? styles.commentVisibilityNoteInternal
              : styles.commentVisibilityNoteExternal
          }
        >
          {activeTab === "INTERNAL" ? (
            <>
              <i className="ti ti-lock" /> Interne Kommentare sind nur für AGENT und ADMIN sichtbar.
            </>
          ) : (
            "Sichtbar für den Ticketersteller."
          )}
        </p>
      )}

      <div className={styles.commentList}>
        {visibleComments.length === 0 && <p className={styles.metaText}>Noch keine Kommentare.</p>}
        {visibleComments.map((comment) => (
          <CommentListItem
            key={comment.id}
            comment={comment}
            isOwn={comment.authorId === currentUserId}
            updateAction={updateAction}
          />
        ))}
      </div>

      <NewCommentForm
        // Remount on tab switch — otherwise the uncontrolled visibility
        // <select> keeps whatever value it had at first mount instead
        // of following the active tab.
        key={activeTab}
        visibility={activeTab}
        canChooseVisibility={canChooseVisibility}
        createAction={createAction}
      />
    </div>
  );
}
