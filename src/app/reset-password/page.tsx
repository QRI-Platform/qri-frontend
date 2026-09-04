"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { apiFetch } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const result = await apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    /**
     * Straight to login, not into the app. Resetting deliberately
     * doesn't sign the student in - anyone holding the link could
     * otherwise take the session. Typing the new password proves they
     * know it.
     */
    router.replace("/login");
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm font-semibold text-destructive">This link is incomplete</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Open the link from your email exactly as it was sent, or request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-semibold text-[var(--brand-blue)] hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        id="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        minLength={8}
        placeholder="New password (at least 8 characters)"
      />

      <PasswordInput
        id="confirm-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        minLength={8}
        placeholder="Confirm new password"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-xl bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something you'll remember"
      footer={
        <>
          Changed your mind?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand-blue)] hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      {/**
       * useSearchParams needs a Suspense boundary in the App Router.
       * Without one the build fails.
       */}
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}