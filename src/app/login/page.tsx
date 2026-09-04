"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth-client";

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    saveToken(result.data.token);

    // The login response already includes the role, so this costs no
    // extra request. Admins land on the admin panel; students carry on
    // to class selection as before.
    router.push(result.data.user.role === "ADMIN" ? "/admin" : "/select-class");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep learning"
      footer={
        <>
          New to QRI?{" "}
          <Link href="/signup" className="font-semibold text-[var(--brand-blue)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
          />
        </div>

                <PasswordInput id="password" value={password} onChange={setPassword} />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-muted-foreground hover:text-[var(--brand-blue)]"
          >
            Forgot password?
          </Link>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}