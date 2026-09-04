"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-require-auth";

const CLASSES = [6, 7, 8, 9, 10, 11, 12] as const;

const EXAM_TRACKS = [
  { key: "NONE", label: "None" },
  { key: "NEET", label: "NEET" },
  { key: "IIT_JEE", label: "IIT-JEE" },
  { key: "NDA", label: "NDA" },
] as const;

interface UpdateClassResponse {
  user: { id: string; grade: number; examTrack: string };
}

export default function SelectClassPage() {
  const ready = useRequireAuth();
  const router = useRouter();
  const [grade, setGrade] = useState<number | null>(null);
  const [examTrack, setExamTrack] = useState<string>("NONE");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (grade === null) return;
    setError("");
    setLoading(true);

    const result = await apiFetch<UpdateClassResponse>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ grade, examTrack }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.push("/chat");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Which class are you in?</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This helps us tailor questions and answers to your level.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-3 sm:grid-cols-7">
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setGrade(c)}
                className={`flex h-14 items-center justify-center rounded-xl border text-lg font-bold transition ${
                  grade === c
                    ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                    : "border-border text-foreground hover:bg-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-sm font-semibold">Preparing for a competitive exam?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAM_TRACKS.map((t) => (
                <button
                  key={t.key}
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
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <button
            onClick={handleContinue}
            disabled={grade === null || loading}
            className="mt-10 w-full rounded-xl bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </main>
    </div>
  );
}