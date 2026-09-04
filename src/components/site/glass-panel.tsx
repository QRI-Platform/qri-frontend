"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared card shell used across Pillars, Modalities, and How-it-works.
 * One place to tune "premium card" behaviour: a soft colour tint,
 * a glass/mirror sheen across the top, and a snappy (not childish)
 * spring lift on hover. Change it here and every card site-wide updates.
 */
const TINTS = {
  blue: {
    bg: "bg-blue-50/70",
    border: "border-blue-100",
    glow: "hover:shadow-blue-200/50",
  },
  violet: {
    bg: "bg-violet-50/70",
    border: "border-violet-100",
    glow: "hover:shadow-violet-200/50",
  },
  teal: {
    bg: "bg-teal-50/70",
    border: "border-teal-100",
    glow: "hover:shadow-teal-200/50",
  },
  amber: {
    bg: "bg-amber-50/70",
    border: "border-amber-100",
    glow: "hover:shadow-amber-200/50",
  },
  rose: {
    bg: "bg-rose-50/70",
    border: "border-rose-100",
    glow: "hover:shadow-rose-200/50",
  },
} as const;

export type TintKey = keyof typeof TINTS;

interface GlassPanelProps {
  tint?: TintKey;
  index?: number;
  className?: string;
  children: ReactNode;
}

export function GlassPanel({ tint = "blue", index = 0, className = "", children }: GlassPanelProps) {
  const t = TINTS[tint];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -6,
        scale: 1.015,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      className={`group relative overflow-hidden rounded-2xl border ${t.border} ${t.bg} p-6 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl ${t.glow} ${className}`}
    >
      {/* mirror / glass sheen - soft highlight across the top, like light on glass */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/50 to-transparent" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}