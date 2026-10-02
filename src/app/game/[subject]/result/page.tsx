"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, Trophy, RotateCcw, ArrowRight, Lightbulb, Map } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequirePlan } from "@/lib/use-require-plan";
import { apiFetch } from "@/lib/api";
import { MathText } from "@/components/ui/math-text";

interface ResultQuestion {
  id: string;
  position: number;
  questionText: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  explanation: string | null;
}

interface ResultData {
  subject: { code: string; name: string };
  level: number;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  passed: boolean;
  passMark: number;
  nextLevel: number | null;
  unlockedNextLevel: boolean;
  badgeUnlocked: { code: string; name: string } | null;
  questions: ResultQuestion[];
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

function ResultScreen() {
  const status = useRequirePlan();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectCode = typeof params.subject === "string" ? params.subject : "";
  const attemptId = searchParams.get("attemptId") ?? "";

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const colour = SUBJECT_COLOURS[subjectCode] ?? "#1D7EF2";

  useEffect(() => {
    if (status !== "allowed" || !attemptId) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, attemptId]);

  async function load() {
    const result = await apiFetch<ResultData>(`/api/game/attempt/${attemptId}`);
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setData(result.data);
  }

  if (status !== "allowed") return null;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading your result...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6 text-center">
          <div>
            <p className="font-semibold">Couldn&apos;t load this result</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => router.push(`/game/${subjectCode}`)}
              className="mt-5 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary"
            >
              Back to levels
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {/* --- Score --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-6 text-center text-white shadow-lg"
            style={{
              background: data.passed
                ? `linear-gradient(135deg, ${colour}, var(--brand-navy))`
                : "linear-gradient(135deg, #64748B, var(--brand-navy))",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              {data.subject.name} &middot; Level {data.level}
            </p>

            <motion.p
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="mt-3 text-5xl font-extrabold"
            >
              {data.accuracyPercent}%
            </motion.p>

            <p className="mt-1 text-sm text-white/80">
              {data.score} of {data.totalQuestions} correct
            </p>

            <p className="mt-4 text-lg font-bold">
              {data.passed ? "Level cleared" : "Not quite"}
            </p>
            {!data.passed && (
              <p className="mt-1 text-sm text-white/80">
                You need {data.passMark}% to move on. Try again?
              </p>
            )}
          </motion.div>

          {/* --- Badge unlock --- */}
          {data.badgeUnlocked && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 flex items-center gap-4 rounded-2xl border-2 border-[var(--brand-teal)] bg-[var(--brand-teal)]/5 p-5"
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 0] }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-teal)]"
              >
                <Trophy className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-teal)]">
                  Badge unlocked
                </p>
                <p className="text-lg font-bold">{data.badgeUnlocked.name}</p>
                <p className="text-xs text-muted-foreground">
                  in {data.subject.name}
                </p>
              </div>
            </motion.div>
          )}

          {/* --- Actions --- */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => router.push(`/game/${subjectCode}/play?level=${data.level}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold transition hover:bg-secondary"
            >
              <RotateCcw className="h-4 w-4" />
              Replay level {data.level}
            </button>

            {data.passed && data.nextLevel ? (
              <button
                onClick={() => router.push(`/game/${subjectCode}/play?level=${data.nextLevel}`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: colour }}
              >
                Level {data.nextLevel}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push(`/game/${subjectCode}`)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: colour }}
              >
                <Map className="h-4 w-4" />
                Level map
              </button>
            )}
          </div>

          {/* --- Review ---
              The explanations are the part that teaches. Showing only
              right and wrong would tell a student they failed without
              telling them anything useful, so every question is
              expanded by default rather than hidden behind a tap. */}
          <p className="mt-8 text-sm font-bold">Review</p>

          <div className="mt-3 space-y-3">
            {data.questions.map((question, index) => (
              <div
                key={question.id}
                className={`rounded-2xl border-2 bg-card p-4 sm:p-5 ${
                  question.isCorrect
                    ? "border-[var(--brand-teal)]/30"
                    : "border-destructive/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      question.isCorrect ? "bg-[var(--brand-teal)]" : "bg-destructive"
                    }`}
                  >
                    {question.isCorrect ? (
                      <Check className="h-4 w-4 text-white" strokeWidth={3} />
                    ) : (
                      <X className="h-4 w-4 text-white" strokeWidth={3} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Question {index + 1}
                    </p>
                    <div className="mt-1 text-sm font-semibold leading-relaxed">
                      <MathText>{question.questionText}</MathText>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectOption = optionIndex === question.correctOption;
                    const wasChosen = optionIndex === question.selectedOption;

                    return (
                      <div
                        key={optionIndex}
                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-sm ${
                          isCorrectOption
                            ? "border-[var(--brand-teal)] bg-[var(--brand-teal)]/5"
                            : wasChosen
                              ? "border-destructive bg-destructive/5"
                              : "border-border opacity-60"
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <MathText>{option}</MathText>
                        </span>
                        {isCorrectOption && (
                          <span className="shrink-0 text-[11px] font-bold text-[var(--brand-teal)]">
                            Correct
                          </span>
                        )}
                        {wasChosen && !isCorrectOption && (
                          <span className="shrink-0 text-[11px] font-bold text-destructive">
                            You chose
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* An unanswered question would otherwise look the
                      same as a wrong one. */}
                  {question.selectedOption === null && (
                    <p className="text-xs font-medium text-muted-foreground">
                      You didn&apos;t answer this one.
                    </p>
                  )}
                </div>

                {question.explanation && (
                  <div className="mt-4 rounded-xl bg-secondary p-3.5">
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-[var(--brand-teal)]" />
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--brand-teal)]">
                        Why
                      </p>
                    </div>
                    <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      <MathText>{question.explanation}</MathText>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <ResultScreen />
    </Suspense>
  );
} 