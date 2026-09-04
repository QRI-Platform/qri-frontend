"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

export type AdminGuardStatus = "checking" | "allowed";

/**
 * Route guard for admin-only pages. useRequireAuth isn't enough here -
 * it only proves someone is logged in, so an ordinary student could
 * open /admin and watch every request fail with a 403.
 *
 * Important: this is a UX guard, not a security boundary. Anyone can
 * edit client-side JavaScript. The actual protection is requireAdmin
 * on the backend, which refuses non-admins regardless of what the
 * frontend does. This just avoids showing a page that would only
 * error out.
 */
export function useRequireAdmin(): AdminGuardStatus {
  const router = useRouter();
  const [status, setStatus] = useState<AdminGuardStatus>("checking");

  useEffect(() => {
    // Guards against setting state after the component has unmounted -
    // this check is async, so the user could navigate away mid-request.
    let cancelled = false;

    async function check() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      const result = await apiFetch<{ user: { role: string } }>("/api/users/me");
      if (cancelled) return;

      if (!result.ok) {
        router.replace("/login");
        return;
      }

      if (result.data.user.role !== "ADMIN") {
        // Logged in, just not an admin - send them to the app, not to login.
        router.replace("/chat");
        return;
      }

      setStatus("allowed");
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return status;
}