import { Search, MessageCircle, BrainCircuit } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel, type TintKey } from "./glass-panel";
import { IconBadge } from "./icon-badge";

interface Pillar {
  letter: string;
  en: string;
  hi: string;
  icon: LucideIcon;
  tint: TintKey;
  iconBg: string;
  desc: string;
}

const PILLARS: Pillar[] = [
  {
    letter: "Q",
    en: "Quest",
    hi: "Prashn/Jigyasa",
    icon: Search,
    tint: "blue",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    desc: "Ask anything, any subject.",
  },
  {
    letter: "R",
    en: "Response",
    hi: "Uttar",
    icon: MessageCircle,
    tint: "violet",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
    desc: "Clear, step-by-step answers.",
  },
  {
    letter: "I",
    en: "Intelligence",
    hi: "Buddhimatta",
    icon: BrainCircuit,
    tint: "teal",
    iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
    desc: "Learns how you learn.",
  },
];

export function Pillars() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-5 sm:grid-cols-3">
        {PILLARS.map((p, i) => (
          <GlassPanel key={p.letter} tint={p.tint} index={i}>
            <div className="flex items-start gap-4">
              <IconBadge icon={p.icon} className={p.iconBg} />
              <div>
                <p className="font-bold">
                  <span className="text-[var(--brand-blue)]">{p.letter}</span> - {p.en}{" "}
                  <span className="font-medium text-muted-foreground">({p.hi})</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}