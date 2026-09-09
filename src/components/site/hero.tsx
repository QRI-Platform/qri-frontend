import { siteConfig } from "@/lib/site-config";
import { AskDemo } from "./ask-demo";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--brand-blue)]/10 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-[var(--brand-teal)]">
            {siteConfig.name} - {siteConfig.fullName}
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Har Question Ka{" "}
            <span className="bg-gradient-to-br from-[var(--brand-blue)] via-[var(--brand-navy)] to-[var(--brand-teal)] bg-clip-text text-transparent">
              Smart Answer.
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {siteConfig.mission}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--brand-blue)] px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90"
            >
              Start learning free
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 font-semibold transition hover:bg-secondary"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Free to start - Class 6-12 - NEET - IIT-JEE - NDA
          </p>
        </div>

        <div className="md:pl-4">
          <AskDemo />
        </div>
      </div>
    </section>
  );
}