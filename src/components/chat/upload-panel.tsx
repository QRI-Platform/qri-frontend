"use client";

import { motion } from "framer-motion";
import { X, FileText, ExternalLink } from "lucide-react";
import type { SelectedFile } from "./chat-thread";

interface UploadPanelProps {
  file: SelectedFile;
  onClose: () => void;
}

export function UploadPanel({ file, onClose }: UploadPanelProps) {
  return (
    <>
      {/* Backdrop - mobile only, since the panel overlays the chat there. */}
      <div
        className="fixed inset-0 z-50 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/**
       * Animates on x, not width.
       *
       * The panel is full-screen on a phone and a fixed 280px column on
       * desktop, so there's no single width to animate between. Sliding
       * in from the right works for both, and reads more naturally on
       * mobile than a panel growing sideways.
       */}
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-y-0 right-0 z-[60] flex w-full flex-col border-l border-border bg-background sm:w-[380px] lg:static lg:z-auto lg:w-[280px]"
      >
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="truncate text-sm font-semibold">{file.name}</p>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 rounded-lg p-1.5 hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {file.type === "image" && file.url ? (
            <div className="flex flex-1 items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.url}
                alt={file.name}
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            </div>
          ) : file.type === "pdf" && file.url ? (
            /**
             * Mobile browsers handle PDFs in an iframe badly - iOS Safari
             * shows only the first page and won't scroll, and Android
             * Chrome often won't render one at all. The iframe is kept
             * because it works well on desktop, but on small screens a
             * button opens the file in a new tab, where the phone's own
             * PDF viewer handles scrolling and zoom properly.
             */
            <div className="flex min-h-0 flex-1 flex-col">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="m-3 flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-blue)] py-2.5 text-sm font-semibold text-[var(--brand-blue)] transition hover:bg-[var(--brand-blue)]/5 lg:hidden"
              >
                <ExternalLink className="h-4 w-4" />
                Open PDF full screen
              </a>
              <iframe src={file.url} title={file.name} className="min-h-0 w-full flex-1 border-0" />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{file.sizeLabel}</p>
              <p className="text-xs text-muted-foreground">
                Preview not available for this file type yet.
              </p>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}