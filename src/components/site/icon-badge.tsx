import type { LucideIcon } from "lucide-react";

/**
 * Gradient icon badge used inside cards. Deliberately NOT "use client" -
 * it needs no hooks or motion (the hover scale is plain Tailwind
 * group-hover CSS, driven by GlassPanel's `group` class). Keeping it a
 * Server Component is what lets Server Component pages (Pillars,
 * Modalities) pass a Lucide icon into it without a serialization error.
 */
export function IconBadge({ icon: Icon, className = "" }: { icon: LucideIcon; className?: string }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${className}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}