import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { Logo } from "@/components/site/logo";

/**
 * Header for logged-in pages. Deliberately still a Server Component -
 * the profile icon is a plain Link, not a button with an onClick, so
 * this file never needs "use client". Logout lives inside the profile
 * page itself for the same reason.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/chat" aria-label="Go to chat">
          <Logo />
        </Link>

        <Link
          href="/profile"
          aria-label="Your profile"
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <CircleUserRound className="h-6 w-6" />
        </Link>
      </div>
    </header>
  );
}