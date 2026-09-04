"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * Shared shell for /login and /signup. Includes the site Navbar and
 * Footer for a consistent frame. Copy here is kept English-only and
 * neutral in tone, unlike the bilingual marketing copy on the homepage.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="rounded-2xl border border-border bg-card p-7 shadow-xl shadow-blue-500/5">
            <h1 className="text-center text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}