"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import { apiFetch } from "@/lib/api";
import { clearToken } from "@/lib/auth-client";

const CLASSES = [6, 7, 8, 9, 10, 11, 12] as const;

const EXAM_TRACKS = [
  { key: "NONE", label: "None" },
  { key: "NEET", label: "NEET" },
  { key: "IIT_JEE", label: "IIT-JEE" },
  { key: "NDA", label: "NDA" },
] as const;

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  grade: number | null;
  examTrack: string;
}

export default function ProfilePage() {
  const ready = useRequireAuth();
  const router = useRouter();

  // What the server currently has - used to work out what actually changed.
  const [original, setOriginal] = useState<Profile | null>(null);

  // What's on screen right now.
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [examTrack, setExamTrack] = useState("NONE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function loadProfile() {
    setLoading(true);
    const result = await apiFetch<{ user: Profile }>("/api/users/me");
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    const user = result.data.user;
    setOriginal(user);
    setName(user.name);
    setGrade(user.grade);
    setExamTrack(user.examTrack);
  }

  const hasChanges =
    original !== null &&
    (name.trim() !== original.name || grade !== original.grade || examTrack !== original.examTrack);

  async function handleSave() {
    if (!original || !hasChanges) return;

    setError("");
    setSaved(false);
    setSaving(true);

    // Send only what actually changed - this is exactly what the Day 17
    // "all fields optional" change was for. Anything not sent is left
    // untouched on the server.
    const payload: Record<string, string | number> = {};
    if (name.trim() !== original.name) payload.name = name.trim();
    if (grade !== null && grade !== original.grade) payload.grade = grade;
    if (examTrack !== original.examTrack) payload.examTrack = examTrack;

    const result = await apiFetch<{ user: Profile }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setOriginal(result.data.user);
    setSaved(true);
  }

  function handleLogout() {
    clearToken();
    // replace, not push - so the back button doesn't land them on a
    // page they're no longer authorised to see.
    router.replace("/login");
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-6 py-10">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Keep this up to date so answers stay matched to your level.
          </p>

          {loading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading your profile...</p>
          ) : (
            <>
              <div className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6">
                <div>
                  <label htmlFor="name" className="text-sm font-semibold">
                    Name
                  </label>
                  <div className="relative mt-2">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSaved(false);
                      }}
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={original?.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Your email can&apos;t be changed.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">Class</p>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {CLASSES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setGrade(c);
                          setSaved(false);
                        }}
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
                  <p className="text-sm font-semibold">Competitive exam</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXAM_TRACKS.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => {
                          setExamTrack(t.key);
                          setSaved(false);
                        }}
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

                {error && <p className="text-sm text-destructive">{error}</p>}
                {saved && (
                  <p className="text-sm font-medium text-[var(--brand-teal)]">
                    Your changes have been saved.
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving || !name.trim()}
                  className="w-full rounded-xl bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>

              {/* Only rendered for admins. This is convenience, not
                  security - the backend refuses non-admins regardless
                  of whether this link is visible. */}
              {original?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--brand-teal)] py-2.5 text-sm font-semibold text-[var(--brand-teal)] transition hover:bg-[var(--brand-teal)]/5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Open admin panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}