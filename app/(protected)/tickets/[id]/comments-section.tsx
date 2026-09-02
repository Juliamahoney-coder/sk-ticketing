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

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentMeta}>
        <span className={styles.commentAuthor}>{comment.authorName}</span>
        <span>{comment.createdAt.toLocaleString("de-DE")}</span>
        {edited && <span>(bearbeitet)</span>}
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
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button type="submit" className={styles.buttonPrimary}>
              Speichern
            </button>
            <button type="button" className={styles.button} onClick={() => setEditing(false)}>
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
    <form action={createAction}>
      <div className={styles.field}>
        <textarea
          name="body"
          placeholder="Kommentar hinzufügen…"
          required
          rows={3}
          className={styles.textarea}
        />
      </div>
      <div className={styles.field} style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input type="file" name="file" className={styles.input} style={{ flex: 1 }} />
        {canChooseVisibility && (
          <select name="visibility" defaultValue={visibility} className={styles.select} style={{ width: 140 }}>
            <option value="INTERNAL">Intern</option>
            <option value="EXTERNAL">Extern</option>
          </select>
        )}
      </div>
      <div className={styles.field}>
        <button type="submit" className={styles.buttonPrimary}>
          Kommentieren
        </button>
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
    <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
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

      <div style={{ padding: 14 }}>
        <p
          className={
            activeTab === "INTERNAL"
              ? styles.commentVisibilityNoteInternal
              : styles.commentVisibilityNoteExternal
          }
        >
          {activeTab === "INTERNAL" ? "Nur für Bearbeiter sichtbar" : "Sichtbar für den Ticketersteller"}
        </p>

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
    </div>
  );
}
