"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Info } from "lucide-react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  variant?: "locked" | "info";
}

/**
 * A brief message that slides up from the bottom and disappears.
 *
 * Used where a tap does nothing - a locked level, for instance. Without
 * feedback a student can't tell whether the app is broken or the
 * action simply isn't allowed yet.
 */
export function Toast({ message, onDismiss, variant = "info" }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 2200);
    return () => clearTimeout(timer);
    // Re-runs on each new message, so a second tap restarts the timer
    // rather than inheriting the first one's remaining time.
  }, [message, onDismiss]);

  const Icon = variant === "locked" ? Lock : Info;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 px-4"
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-[var(--brand-navy)] px-4 py-3 text-sm font-medium text-white shadow-xl">
            <Icon className="h-4 w-4 shrink-0" />
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}