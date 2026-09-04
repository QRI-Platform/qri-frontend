import { Keyboard, Camera, Mic, FileText, FileSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassPanel, type TintKey } from "./glass-panel";
import { IconBadge } from "./icon-badge";

interface Mode {
  icon: LucideIcon;
  title: string;
  hi: string;
  desc: string;
  tint: TintKey;
  iconBg: string;
}

const MODES: Mode[] = [
  {
    icon: Keyboard,
    title: "Type it",
    hi: "Likhkar poocho",
    desc: "Ask in English, Hindi, or a mix - however you think.",
    tint: "blue",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    icon: Camera,
    title: "Snap a photo",
    hi: "Photo kheencho",
    desc: "Point your camera at a textbook question and get it solved.",
    tint: "violet",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
  },
  {
    icon: Mic,
    title: "Just speak",
    hi: "Bolkar poocho",
    desc: "Say your doubt out loud and hear the answer back.",
    tint: "teal",
    iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
  },
  {
    icon: FileText,
    title: "Upload a document",
    hi: "Document upload karo",
    desc: "Share a Word file - we read it and explain the answer.",
    tint: "amber",
    iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
  },
  {
    icon: FileSearch,
    title: "Upload a PDF",
    hi: "PDF upload karo",
    desc: "Drop in a PDF - we read the whole thing and answer from it.",
    tint: "rose",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-600",
  },
];

export function Modalities() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Five ways to ask</h2>
        <p className="mt-3 text-muted-foreground">
          Kuch bhi poocho, sab kuch seekho - whichever way is easiest for you.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {MODES.map((m, i) => (
          <GlassPanel key={m.title} tint={m.tint} index={i}>
            <IconBadge icon={m.icon} className={m.iconBg} />
            <h3 className="mt-4 text-base font-bold">{m.title}</h3>
            <p className="text-xs font-medium text-muted-foreground">{m.hi}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}