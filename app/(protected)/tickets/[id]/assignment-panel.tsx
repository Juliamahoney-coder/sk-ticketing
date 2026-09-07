import Link from "next/link";
import styles from "@/app/styles/ui.module.css";

type PersonOption = { id: string; name: string };

export function AssignmentPanel({
  ticketId,
  currentUserId,
  owner,
  followers,
  assignToMeAction,
  followAction,
}: {
  ticketId: string;
  currentUserId: string;
  owner: PersonOption | null;
  followers: PersonOption[];
  assignToMeAction: (formData: FormData) => void;
  followAction: (formData: FormData) => void;
}) {
  const isOwner = owner?.id === currentUserId;
  const isFollowing = followers.some((f) => f.id === currentUserId);

  return (
    <div className={styles.card} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 className={styles.cardTitle}>Zuweisung</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className={styles.infoLabel}>Bearbeiter</span>
        <span className={styles.infoValue}>{owner?.name ?? "—"}</span>
        {!isOwner && (
          <form action={assignToMeAction}>
            <button type="submit" className={`${styles.buttonOutline} ${styles.buttonSm}`} style={{ width: "100%" }}>
              Mir zuweisen
            </button>
          </form>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--sk-border-light)", paddingTop: 16 }}>
        <span className={styles.infoLabel}>Mitbearbeiter</span>
        {followers.length === 0 ? (
          <span className={styles.metaText}>Noch niemand.</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {followers.map((f) => (
              <span key={f.id} className={`${styles.badge} ${styles.badgeNeutral}`}>
                {f.name}
              </span>
            ))}
          </div>
        )}
        {!isFollowing && (
          <form action={followAction}>
            <button type="submit" className={`${styles.buttonOutline} ${styles.buttonSm}`} style={{ width: "100%" }}>
              Folgen
            </button>
          </form>
        )}
      </div>

      <Link
        href={`/tickets/${ticketId}/settings`}
        className={styles.commentEditToggle}
        style={{ borderTop: "1px solid var(--sk-border-light)", paddingTop: 16 }}
      >
        Verwalten
      </Link>
    </div>
  );
}
