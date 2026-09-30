"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Flame, Play, Lock, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequirePlan } from "@/lib/use-require-plan";
import { apiFetch } from "@/lib/api";

interface Badge {
  code: string;
  name: string;
}

interface SubjectProgress {
  code: string;
  name: string;
  levelsCompleted: number;
  totalLevels: number;
  currentLevel: number;
  accuracyPercent: number;
  highestBadge: Badge | null;
  lastPlayedAt: string | null;
}

/**
 * A colour per subject, so cards are recognisable at a glance rather
 * than eleven identical tiles. Keyed by subject code; anything missing
 * falls back to the brand blue.
 */
const SUBJECT_COLOURS: Record<string, string> = {
  hindi: "#E85D75",
  english: "#7C6BF0",
  maths: "#1D7EF2",
  science: "#17A398",
  social_science: "#E8873D",
  computer: "#5B8DEF",
  gk: "#C2569B",
  physics: "#3B6FE0",
  chemistry: "#17A398",
  biology: "#4CAF6D",
  commerce: "#D4A017",
  history: "#B5651D",
  geography: "#2E9E8F",
  polity: "#8B5CF6",
  economy: "#D97757",
};

function colourFor(code: string) {
  return SUBJECT_COLOURS[code] ?? "#1D7EF2";
}

export default function GamePage() {
  const status = useRequirePlan();

  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "allowed") return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function load() {
    const result = await apiFetch<{ subjects: SubjectProgress[] }>("/api/game/subjects");
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSubjects(result.data.subjects);
  }

  if (status !== "allowed") return null;

  const started = subjects.filter((s) => s.levelsCompleted > 0);
  const totalLevelsDone = subjects.reduce((sum, s) => sum + s.levelsCompleted, 0);
  const badgesEarned = subjects.filter((s) => s.highestBadge !== null).length;

  /**
   * The most recently played subject gets its own card at the top.
   * A student who is mid-way through something shouldn't have to hunt
   * for it among eleven tiles.
   */
  const continueWith = [...started].sort((a, b) =>
    (b.lastPlayedAt ?? "").localeCompare(a.lastPlayedAt ?? ""),
  )[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          {/* --- Header with running totals --- */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-teal)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-teal)]">
                <Sparkles className="h-3 w-3" />
                Practice arena
              </span>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Level up, one subject at a time
              </h1>
            </div>

            {!loading && (
              <div className="flex gap-5">
                <div className="text-right">
                  <p className="text-2xl font-bold">{totalLevelsDone}</p>
                  <p className="text-[11px] text-muted-foreground">levels cleared</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{badgesEarned}</p>
                  <p className="text-[11px] text-muted-foreground">badges earned</p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="mt-10 text-sm text-muted-foreground">Loading subjects...</p>
          ) : subjects.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm font-semibold">No subjects available</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Set your class in your profile to start practising.
              </p>
              <Link
                href="/profile"
                className="mt-4 inline-block text-sm font-semibold text-[var(--brand-blue)] hover:underline"
              >
                Go to profile
              </Link>
            </div>
          ) : (
            <>
              {/* --- Continue where they left off --- */}
              {continueWith && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8"
                >
                  <Link
                    href={`/game/${continueWith.code}`}
                    className="group flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-white shadow-lg transition hover:shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${colourFor(continueWith.code)}, var(--brand-navy))`,
                    }}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                      <Flame className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                        Continue
                      </p>
                      <p className="truncate text-lg font-bold">{continueWith.name}</p>
                      <p className="text-xs text-white/80">
                        Level {continueWith.currentLevel} &middot; {continueWith.accuracyPercent}%
                        accuracy
                      </p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </div>
                  </Link>
                </motion.div>
              )}

              <p className="mt-8 text-sm font-bold">All subjects</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject, index) => {
                  const colour = colourFor(subject.code);
                  const percentComplete = Math.round(
                    (subject.levelsCompleted / subject.totalLevels) * 100,
                  );
                  const hasStarted = subject.levelsCompleted > 0;

                  return (
                    <motion.div
                      key={subject.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      // Staggered so the grid assembles rather than
                      // appearing all at once. Capped so the last card
                      // doesn't wait noticeably.
                      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <Link
                        href={`/game/${subject.code}`}
                        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        {/* A tint of the subject colour, so each card
                            reads differently without being loud. */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 transition group-hover:opacity-20"
                          style={{ backgroundColor: colour }}
                        />

                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                            style={{ backgroundColor: colour }}
                          >
                            {subject.name.charAt(0)}
                          </div>

                          {subject.highestBadge ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-teal)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-teal)]">
                              <Trophy className="h-2.5 w-2.5" />
                              {subject.highestBadge.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <Lock className="h-2.5 w-2.5" />
                              Level 5
                            </span>
                          )}
                        </div>

                        <p className="mt-3 font-bold">{subject.name}</p>

                        <div className="mt-auto pt-4">
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="font-semibold">
                              {subject.levelsCompleted}
                              <span className="text-muted-foreground">
                                /{subject.totalLevels}
                              </span>
                            </span>
                            {/* Accuracy is hidden until they've answered
                                something - "0%" on an untouched subject
                                reads as failure rather than not started. */}
                            {hasStarted && (
                              <span className="text-muted-foreground">
                                {subject.accuracyPercent}%
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: colour }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentComplete}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                            />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}