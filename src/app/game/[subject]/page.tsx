"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Lock, Play, Trophy, Target, Flame } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequirePlan } from "@/lib/use-require-plan";
import { apiFetch } from "@/lib/api";
import { Toast } from "@/components/ui/toast";

interface Badge {
  code: string;
  name: string;
  minLevel: number;
}

interface Level {
  level: number;
  unlocked: boolean;
  completed: boolean;
  isCurrent: boolean;
  accuracyPercent: number | null;
  badgeAtThisLevel: boolean;
}

interface LevelMapData {
  subject: { code: string; name: string };
  levelsCompleted: number;
  currentLevel: number;
  totalLevels: number;
  accuracyPercent: number;
  badges: Badge[];
  levels: Level[];
}

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

const ALL_TIERS = [
  { minLevel: 5, name: "Noob" },
  { minLevel: 15, name: "Rookie" },
  { minLevel: 25, name: "Warrior" },
  { minLevel: 35, name: "Master" },
  { minLevel: 50, name: "Prime Master" },
];

/**
 * Horizontal offset per level, cycling through a wave.
 *
 * A straight column of fifty circles reads as a list. Nudging them
 * side to side makes it read as a path, which is the point of this
 * screen.
 */
const WAVE = [0, 40, 64, 40, 0, -40, -64, -40];

export default function LevelMapPage() {
  const status = useRequirePlan();
  const params = useParams();
  const router = useRouter();
  const subjectCode = typeof params.subject === "string" ? params.subject : "";

  const [data, setData] = useState<LevelMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "allowed" || !subjectCode) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, subjectCode]);

  useEffect(() => {
    // Scroll to where they're up to. At level 40 of 50, landing at the
    // top would mean scrolling past everything already done.
    if (!data || !currentRef.current) return;
    currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [data]);

  async function load() {
    const result = await apiFetch<LevelMapData>(`/api/game/levels/${subjectCode}`);
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setData(result.data);
  }

  function handleLevelClick(level: Level) {
    if (!level.unlocked) {
      // A tap that does nothing feels broken. Say why, and say what
      // would change it.
      setToast(`Level ${level.level} is locked — clear level ${data?.currentLevel} first`);
      return;
    }
    router.push(`/game/${subjectCode}/play?level=${level.level}`);
  }

  if (status !== "allowed") return null;

  const colour = SUBJECT_COLOURS[subjectCode] ?? "#1D7EF2";
  const nextBadge = data
    ? ALL_TIERS.find((tier) => tier.minLevel > data.levelsCompleted)
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-4 pb-16 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <Link
            href="/game"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All subjects
          </Link>

          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="mt-8 text-sm text-muted-foreground">Loading levels...</p>
          ) : data ? (
            /**
             * Two columns on desktop: the path on the left, progress
             * and badges pinned on the right. On a phone the sidebar
             * stacks above the path, so the useful summary is seen
             * first.
             */
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
              {/* --- The path --- */}
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl border border-border bg-card/40 px-4 py-8">
                  <div className="relative flex flex-col items-center gap-4">
                    {data.levels.map((level, index) => {
                      const offset = WAVE[index % WAVE.length];
                      const isLast = index === data.levels.length - 1;

                      return (
                        <div
                          key={level.level}
                          ref={level.isCurrent ? currentRef : undefined}
                          className="relative flex items-center justify-center"
                          style={{ transform: `translateX(${offset}px)` }}
                        >
                          {!isLast && (
                            <div
                              aria-hidden
                              className="absolute left-1/2 top-full h-4 w-1 -translate-x-1/2 rounded-full"
                              style={{
                                backgroundColor: level.completed ? colour : "var(--border)",
                                opacity: level.completed ? 0.4 : 1,
                              }}
                            />
                          )}

                          <div className="flex items-center gap-3">
                            <motion.button
                              onClick={() => handleLevelClick(level)}
                              whileTap={{ scale: 0.92 }}
                              whileHover={level.unlocked ? { scale: 1.06 } : undefined}
                              aria-label={
                                level.unlocked
                                  ? `Level ${level.level}${level.completed ? ", completed" : ""}`
                                  : `Level ${level.level}, locked`
                              }
                              className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 font-bold transition ${
                                level.unlocked
                                  ? "border-white text-white shadow-lg"
                                  : "border-border bg-secondary text-muted-foreground"
                              }`}
                              style={
                                level.unlocked
                                  ? {
                                      backgroundColor: level.completed
                                        ? colour
                                        : "var(--brand-navy)",
                                    }
                                  : undefined
                              }
                            >
                              {level.isCurrent && (
                                <motion.span
                                  aria-hidden
                                  className="absolute inset-0 rounded-full"
                                  style={{ border: `3px solid ${colour}` }}
                                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                                />
                              )}

                              {level.completed ? (
                                <Check className="h-7 w-7" strokeWidth={3} />
                              ) : !level.unlocked ? (
                                <Lock className="h-5 w-5" />
                              ) : (
                                <Play className="ml-0.5 h-6 w-6 fill-current" />
                              )}

                              {level.badgeAtThisLevel && (
                                <span
                                  className={`absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow ${
                                    level.completed
                                      ? "bg-[var(--brand-teal)]"
                                      : level.unlocked
                                        ? "bg-[var(--brand-teal)]/60"
                                        : "bg-border"
                                  }`}
                                >
                                  <Trophy className="h-3 w-3 text-white" />
                                </span>
                              )}
                            </motion.button>

                            <div className="min-w-[80px]">
                              <p
                                className={`text-sm font-bold ${
                                  level.unlocked ? "" : "text-muted-foreground"
                                }`}
                              >
                                Level {level.level}
                              </p>
                              {level.accuracyPercent !== null ? (
                                <p className="text-xs text-muted-foreground">
                                  {level.accuracyPercent}% accuracy
                                </p>
                              ) : level.isCurrent ? (
                                <p className="text-xs font-medium" style={{ color: colour }}>
                                  Play now
                                </p>
                              ) : level.badgeAtThisLevel ? (
                                <p className="text-xs text-muted-foreground">Badge level</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* --- Summary sidebar --- */}
              <div className="order-1 space-y-4 lg:sticky lg:top-6 lg:order-2">
                <div
                  className="rounded-2xl p-5 text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${colour}, var(--brand-navy))` }}
                >
                  <p className="text-xl font-extrabold">{data.subject.name}</p>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold">
                        {data.levelsCompleted}
                        <span className="text-base font-medium text-white/70">
                          /{data.totalLevels}
                        </span>
                      </p>
                      <p className="text-xs text-white/70">levels cleared</p>
                    </div>
                    {data.levelsCompleted > 0 && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{data.accuracyPercent}%</p>
                        <p className="text-xs text-white/70">accuracy</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      className="h-full rounded-full bg-white"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(data.levelsCompleted / data.totalLevels) * 100}%`,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>

                <button
                  onClick={() =>
                    router.push(`/game/${subjectCode}/play?level=${data.currentLevel}`)
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                  style={{ backgroundColor: colour }}
                >
                  <Flame className="h-4 w-4" />
                  {data.levelsCompleted > 0 ? "Continue" : "Start"} level {data.currentLevel}
                </button>

                {/* Next badge, so the goal is always visible without
                    scrolling the path to find it. */}
                {nextBadge && (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-[var(--brand-teal)]" />
                      <p className="text-xs font-bold">Next badge</p>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{nextBadge.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {nextBadge.minLevel - data.levelsCompleted} more level
                      {nextBadge.minLevel - data.levelsCompleted === 1 ? "" : "s"} to go
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-bold">Badges</p>
                  <div className="mt-3 space-y-2">
                    {ALL_TIERS.map((tier) => {
                      const earned = data.levelsCompleted >= tier.minLevel;
                      return (
                        <div key={tier.name} className="flex items-center gap-2.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                              earned ? "bg-[var(--brand-teal)]" : "bg-secondary"
                            }`}
                          >
                            <Trophy
                              className={`h-3.5 w-3.5 ${
                                earned ? "text-white" : "text-muted-foreground"
                              }`}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold ${
                                earned ? "" : "text-muted-foreground"
                              }`}
                            >
                              {tier.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Level {tier.minLevel}
                            </p>
                          </div>
                          {earned && <Check className="h-3.5 w-3.5 text-[var(--brand-teal)]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Toast message={toast} onDismiss={() => setToast(null)} variant="locked" />
    </div>
  );
}