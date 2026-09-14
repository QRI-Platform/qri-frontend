"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, User } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth-client";

const CLASSES = [6, 7, 8, 9, 10, 11, 12] as const;

const EXAM_TRACKS = [
  { key: "NONE", label: "None" },
  { key: "NEET", label: "NEET" },
  { key: "IIT_JEE", label: "IIT-JEE" },
  { key: "NDA", label: "NDA" },
] as const;

interface RegisterResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [examTrack, setExamTrack] = useState("NONE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (grade === null) {
      setError("Please choose your class.");
      return;
    }

    setLoading(true);

    const result = await apiFetch<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, grade, examTrack }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    saveToken(result.data.token);
    /**
     * Straight to the plan page. A new student has no subscription, so
     * /chat would only bounce them here anyway - going directly avoids
     * a visible flash of the wrong page.
     */
    router.push("/upgrade");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Tell us your class so answers match your level"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
          />
        </div>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
          />
        </div>

        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
        />

        <PasswordInput
          id="confirm-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={8}
          placeholder="Confirm password"
        />

        <div className="pt-1">
          <p className="text-sm font-semibold">Your class</p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {CLASSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setGrade(c)}
                className={`flex h-11 items-center justify-center rounded-xl border text-base font-bold transition ${
                  grade === c
                    ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Preparing for an exam?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAM_TRACKS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setExamTrack(t.key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  examTrack === t.key
                    ? "border-[var(--brand-teal)] bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            You can change these any time from your profile.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}