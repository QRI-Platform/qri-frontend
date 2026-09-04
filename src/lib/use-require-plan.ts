"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

export type PlanGuardStatus = "checking" | "allowed";

/**
 * Route guard for pages that need a paid plan. Runs the login check too,
 * so pages using this don't also need useRequireAuth.
 *
 * Like the admin guard, this is a UX measure rather than a security
 * boundary - requireActivePlan on the backend is what actually stops an
 * unpaid student asking questions. This exists so they see a pricing
 * page instead of a chat window where every message fails.
 */
export function useRequirePlan(): PlanGuardStatus {
  const router = useRouter();
  const [status, setStatus] = useState<PlanGuardStatus>("checking");

  useEffect(() => {
    // Guards against setting state after unmount - this check is async.
    let cancelled = false;

    async function check() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      const result = await apiFetch<{ plan: { status: string } }>("/api/users/me");
      if (cancelled) return;

      if (!result.ok) {
        router.replace("/login");
        return;
      }

      const planStatus = result.data.plan.status;

      // EXEMPT is an admin - they never need to pay.
      if (planStatus !== "ACTIVE" && planStatus !== "EXEMPT") {
        router.replace("/upgrade");
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