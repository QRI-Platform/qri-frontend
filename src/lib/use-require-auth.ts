"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth-client";

/**
 * Client-side route guard. The JWT lives in localStorage (a browser-only
 * API), so this check can only run in the browser - Next.js middleware
 * can't see localStorage the way it could see a cookie. This is a direct
 * consequence of the Day 6 localStorage choice.
 *
 * Returns true once it's confirmed a token exists and the page is safe
 * to render. Returns false while checking, or if there's no token - in
 * that second case, it's already in the middle of redirecting to /login.
 */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  return ready;
}