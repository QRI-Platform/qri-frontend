"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A confirmation dialog for destructive actions.
 *
 * Kept generic rather than tied to chat deletion, since anything else
 * irreversible should look and behave the same way.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Escape should cancel - people expect it, and it's a way out that
  // doesn't involve aiming at a small button.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
            aria-hidden="true"
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-destructive/20 bg-card shadow-xl"
          >
            <div className="flex items-start gap-3 border-b border-destructive/20 bg-destructive/5 p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-destructive">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{message}</p>
              </div>
            </div>

            <div className="flex gap-2 p-4">
              <button
                onClick={onCancel}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold transition hover:bg-secondary"
              >
                {cancelLabel}
              </button>
              {/**
               * The destructive action is on the right and is the only
               * filled button, so it reads as the deliberate choice
               * rather than the easy one.
               */}
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}