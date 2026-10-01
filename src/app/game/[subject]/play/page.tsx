"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequirePlan } from "@/lib/use-require-plan";
import { apiFetch } from "@/lib/api";
import { MathText } from "@/components/ui/math-text";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Question {
  id: string;
  position: number;
  questionText: string;
  options: string[];
  selectedOption: number | null;
}

interface StartResponse {
  attemptId: string;
  level: number;
  resumed: boolean;
  questions: Question[];
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

/**
 * Preparing a level takes around twenty seconds, measured on Day 8.
 * A static spinner for that long reads as a hang, so these rotate to
 * show the work is ongoing. They describe what is actually happening
 * rather than inventing progress.
 */
const LOADING_STEPS = [
  "Setting up your level",
  "Choosing questions for your class",
  "Matching the difficulty",
  "Almost ready",
];

function QuizScreen() {
  const status = useRequirePlan();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectCode = typeof params.subject === "string" ? params.subject : "";
  const level = Number(searchParams.get("level") ?? "1");

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const colour = SUBJECT_COLOURS[subjectCode] ?? "#1D7EF2";

  useEffect(() => {
    if (status !== "allowed" || !subjectCode) return;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, subjectCode, level]);

  // Rotate the loading text while the questions are being prepared.
  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, LOADING_STEPS.length - 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [loading]);

  async function start() {
    setLoading(true);
    setError("");

    const result = await apiFetch<StartResponse>(`/api/game/start/${subjectCode}`, {
      method: "POST",
      body: JSON.stringify({ level }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setAttemptId(result.data.attemptId);
    setQuestions(result.data.questions);

    /**
     * A resumed attempt may already have answers stored. Restore them
     * so a student who left mid-quiz doesn't start from scratch.
     */
    const restored: Record<string, number> = {};
    for (const question of result.data.questions) {
      if (question.selectedOption !== null) restored[question.id] = question.selectedOption;
    }
    setAnswers(restored);
  }

  function choose(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function submit() {
    if (!attemptId) return;
    setConfirmSubmit(false);
    setSubmitting(true);
    setError("");

    const result = await apiFetch<{ attemptId: string }>(`/api/game/submit/${attemptId}`, {
      method: "POST",
      body: JSON.stringify({
        answers: questions.map((q) => ({
          questionId: q.id,
          // Unanswered is sent explicitly as null rather than omitted,
          // so the server grades it as wrong rather than as missing.
          selectedOption: answers[q.id] ?? null,
        })),
      }),
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error.message);
      return;
    }

    router.replace(`/game/${subjectCode}/result?attemptId=${attemptId}`);
  }

  if (status !== "allowed") return null;

  // --- Preparing the level ---
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <div className="relative mx-auto h-20 w-20">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ border: `4px solid ${colour}`, opacity: 0.2 }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{ borderTopColor: colour }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {level}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="mt-6 text-sm font-semibold"
              >
                {LOADING_STEPS[loadingStep]}
              </motion.p>
            </AnimatePresence>

            <p className="mt-1.5 text-xs text-muted-foreground">
              This takes about twenty seconds
            </p>
          </div>
        </main>
      </div>
    );
  }

  // --- Couldn't prepare the level ---
  if (error && questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <p className="mt-4 font-semibold">Couldn&apos;t start this level</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => router.push(`/game/${subjectCode}`)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                Back
              </button>
              <button
                onClick={() => void start()}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: colour }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const question = questions[index];
  if (!question) return null;

  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const isLast = index === questions.length - 1;
  const selected = answers[question.id];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {/* --- Progress --- */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/game/${subjectCode}`)}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Leave
            </button>
            <p className="text-sm font-semibold">
              Question {index + 1} of {questions.length}
            </p>
            <p className="text-sm text-muted-foreground">Level {level}</p>
          </div>

          <div className="mt-3 flex gap-1">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i === index
                      ? colour
                      : answers[q.id] !== undefined
                        ? `${colour}66`
                        : "var(--secondary)",
                }}
              />
            ))}
          </div>

          {/* --- Question --- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="text-base font-semibold leading-relaxed">
                  <MathText>{question.questionText}</MathText>
                </div>

                <div className="mt-5 space-y-2.5">
                  {question.options.map((option, optionIndex) => {
                    const isChosen = selected === optionIndex;
                    return (
                      <motion.button
                        key={optionIndex}
                        onClick={() => choose(question.id, optionIndex)}
                        whileTap={{ scale: 0.99 }}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left text-sm transition ${
                          isChosen ? "font-semibold" : "border-border hover:bg-secondary"
                        }`}
                        style={
                          isChosen
                            ? { borderColor: colour, backgroundColor: `${colour}14` }
                            : undefined
                        }
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            isChosen ? "text-white" : "border-border text-muted-foreground"
                          }`}
                          style={
                            isChosen ? { backgroundColor: colour, borderColor: colour } : undefined
                          }
                        >
                          {isChosen ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : (
                            String.fromCharCode(65 + optionIndex)
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <MathText>{option}</MathText>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          {/* --- Navigation --- */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {isLast ? (
              <button
                onClick={() =>
                  answeredCount < questions.length ? setConfirmSubmit(true) : void submit()
                }
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: colour }}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Checking..." : "Submit"}
              </button>
            ) : (
              <button
                onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: colour }}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
      </main>

      {/* Warn before submitting with gaps - an unanswered question is
          marked wrong, and 80% is needed to pass. */}
      <ConfirmDialog
        open={confirmSubmit}
        title="Submit with unanswered questions?"
        message={`${questions.length - answeredCount} question${
          questions.length - answeredCount === 1 ? "" : "s"
        } left unanswered. They'll be marked wrong, and you need 80% to clear this level.`}
        confirmLabel="Submit anyway"
        cancelLabel="Go back"
        onConfirm={() => void submit()}
        onCancel={() => setConfirmSubmit(false)}
      />
    </div>
  );
}

export default function PlayPage() {
  // useSearchParams needs a Suspense boundary in the App Router, or
  // the build fails.
  return (
    <Suspense fallback={null}>
      <QuizScreen />
    </Suspense>
  );
}