"use client";

import { useEffect, useRef, useState } from "react";

type Source = "library" | "ai";

interface Sample {
  q: string;
  tag: string;
  source: Source;
  meta: string;
  a: string;
}

const SAMPLES: Sample[] = [
  {
    q: "What is Newton's second Law of Motion?",
    tag: "Physics",
    source: "library",
    meta: "QRI library · Class 9 Physics",
    a: "Force equals mass times acceleration (F = ma). The heavier an object is, the more force you need to move it - and the harder you push, the faster it accelerates.",
  },
  {
    q: "Why is the sky blue?",
    tag: "Science",
    source: "ai",
    meta: "Smart answer",
    a: "Sunlight is made up of many colours. Air scatters shorter blue wavelengths far more than the others, which is why the sky looks blue from every direction.",
  },
  {
    q: "Balance: Fe + O2 -> Fe2O3",
    tag: "Chemistry",
    source: "library",
    meta: "QRI library · Class 10 Chemistry",
    a: "4 Fe + 3 O2 -> 2 Fe2O3. Iron reacts with oxygen to form rust (iron oxide) - the coefficients 4, 3, and 2 balance the atoms on both sides.",
  },
];

export function AskDemo() {
  const [active, setActive] = useState<Sample | null>(null);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"idle" | "searching" | "answering">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function run(sample: Sample) {
    clearTimers();
    setActive(sample);
    setTyped("");
    setPhase("searching");

    timers.current.push(
      setTimeout(() => {
        setPhase("answering");
        let i = 0;
        const tick = () => {
          i += 2;
          setTyped(sample.a.slice(0, i));
          if (i < sample.a.length) timers.current.push(setTimeout(tick, 18));
        };
        tick();
      }, 800),
    );
  }

  useEffect(() => {
    run(SAMPLES[0]);
    return clearTimers;
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.q}
            onClick={() => run(s)}
            className={
              active && active.q === s.q
                ? "rounded-full border border-[var(--brand-blue)]/40 bg-[var(--brand-blue)]/10 px-3 py-1 text-xs font-medium text-[var(--brand-blue)]"
                : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {s.tag}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-3.5 py-2 text-sm">
              {active.q}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {phase === "answering" && (
              <span
                className={
                  active.source === "library"
                    ? "inline-flex w-fit items-center rounded-full bg-[var(--brand-teal)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-teal)]"
                    : "inline-flex w-fit items-center rounded-full bg-[var(--brand-blue)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-blue)]"
                }
              >
                {active.meta}
              </span>
            )}
            <p className="max-w-[92%] rounded-2xl rounded-bl-sm bg-secondary/50 px-3.5 py-2.5 text-sm leading-relaxed">
              {phase === "searching" ? (
                <span className="text-muted-foreground">Checking the QRI library...</span>
              ) : (
                typed
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}