"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
      setError("E-Mail oder Passwort ist falsch.");
      return;
    }

    router.push("/tickets");
    router.refresh();
  }

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginLogo}>
        <Image src="/studienkreis-logo.png" alt="Studienkreis" width={180} height={82} priority />
      </div>

      <div className={styles.loginCard}>
        <div>
          <h1 className={styles.pageTitle}>Anmelden</h1>
          <p className={styles.pageSub}>Interner Zugang für Mitarbeitende.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
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
              disabled={submitting}
              className={styles.input}
            />
          </div>

          {error && (
            <div className={styles.field}>
              <p role="alert" className={styles.noticeError}>
                <i className="ti ti-alert-circle" /> {error}
              </p>
            </div>
          )}

          <div className={styles.field}>
            <button
              type="submit"
              disabled={submitting}
              className={styles.buttonPrimary}
              style={{ width: "100%" }}
            >
              {submitting ? "Lädt…" : "Anmelden"}
            </button>
          </div>
        </form>

        <p className={styles.legal}>
          Zugang wird über das interne Verzeichnis vergeben. Bei Problemen wendest du dich an den
          IT-Support.
        </p>
      </div>
    </main>
  );
}
