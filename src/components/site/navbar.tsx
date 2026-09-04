"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Exams", href: "#exams" },
  { label: "Features", href: "#features" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" aria-label="QRI home">
          <Logo />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Sign Up
          </a>
        </div>

        <button
          className="rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-1 px-6 py-3">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <a href="/login" className="flex-1 rounded-lg border border-border px-4 py-2 text-center text-sm font-semibold">
                Log in
              </a>
              <a href="/signup" className="flex-1 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-center text-sm font-semibold text-white">
                Start free
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}