"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/styles/ui.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Email oder Passwort ist falsch.");
      return;
    }

    router.push("/tickets");
    router.refresh();
  }

  return (
    <main className={styles.page} style={{ maxWidth: 380, marginTop: 80 }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Login</h1>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          {error && (
            <p className={styles.errorText} style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
          <div className={styles.field}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.buttonPrimary}
              style={{ width: "100%" }}
            >
              {submitting ? "Lädt…" : "Einloggen"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
