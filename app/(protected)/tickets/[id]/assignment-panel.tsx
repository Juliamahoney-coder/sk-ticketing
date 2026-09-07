import styles from "@/app/styles/ui.module.css";

type PersonOption = { id: string; name: string };

export function AssignmentPanel({
  currentUserId,
  owner,
  followers,
  candidates,
  assignToMeAction,
  followAction,
  updateFollowersAction,
}: {
  currentUserId: string;
  owner: PersonOption | null;
  followers: PersonOption[];
  candidates: PersonOption[];
  assignToMeAction: (formData: FormData) => void;
  followAction: (formData: FormData) => void;
  updateFollowersAction: (formData: FormData) => void;
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

      <form
        action={updateFollowersAction}
        style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--sk-border-light)", paddingTop: 16 }}
      >
        <label className={styles.label} htmlFor="follower-ids">
          Mitbearbeiter verwalten
        </label>
        <select
          id="follower-ids"
          name="followerIds"
          multiple
          defaultValue={followers.map((f) => f.id)}
          className={styles.select}
          style={{ minHeight: 110 }}
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className={`${styles.buttonSecondary} ${styles.buttonSm}`} style={{ width: "100%" }}>
          Übernehmen
        </button>
      </form>
    </div>
  );
}
