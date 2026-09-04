import { GraduationCap, Stethoscope, Landmark, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel, type TintKey } from "./glass-panel";

interface Step {
  n: number;
  en: string;
  hi: string;
  desc: string;
  tint: TintKey;
}

const STEPS: Step[] = [
  {
    n: 1,
    en: "Ask your question",
    hi: "Apna sawal poocho",
    desc: "Type, snap a photo, speak, or upload a doc/PDF.",
    tint: "blue",
  },
  {
    n: 2,
    en: "We check the QRI library",
    hi: "Pehle hamari library",
    desc: "Verified answers come back instantly.",
    tint: "violet",
  },
  {
    n: 3,
    en: "AI explains the rest",
    hi: "Baaki AI samjhaye",
    desc: "No match? Our AI answers, step by step.",
    tint: "teal",
  },
];

interface Exam {
  icon: LucideIcon;
  title: string;
  sub: string;
  tint: TintKey;
}

const EXAMS: Exam[] = [
  { icon: GraduationCap, title: "Class 6-12", sub: "All subjects", tint: "blue" },
  { icon: Stethoscope, title: "NEET", sub: "Preparation", tint: "violet" },
  { icon: Landmark, title: "IIT-JEE", sub: "Preparation", tint: "amber" },
  { icon: Shield, title: "NDA", sub: "Preparation", tint: "teal" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          From doubt to done, in seconds
        </h2>
        <p className="mt-3 text-muted-foreground">Every question, a smart answer.</p>
      </div>

      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <GlassPanel tint={s.tint} index={i}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-blue)] text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.en}</h3>
              <p className="text-sm text-muted-foreground">{s.hi}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </GlassPanel>
          </li>
        ))}
      </ol>

      <div id="exams" className="mt-14 scroll-mt-20">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Built for
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {EXAMS.map((e, i) => (
            <GlassPanel key={e.title} tint={e.tint} index={i}>
              <div className="flex items-center gap-3">
                <e.icon className="h-6 w-6 shrink-0 text-[var(--brand-teal)]" />
                <div>
                  <p className="text-sm font-bold leading-tight">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.sub}</p>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    </section>
  );
}