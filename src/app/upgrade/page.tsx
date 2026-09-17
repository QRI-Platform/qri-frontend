"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import { apiFetch } from "@/lib/api";

interface Plan {
  code: string;
  name: string;
  amountPaise: number;
  questionLimit: number;
  durationDays: number;
  recommended: boolean;
}

interface SubscribeResponse {
  subscriptionId: string;
  keyId: string;
  planName: string;
  amountPaise: number;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SHARED_FEATURES = [
  "Answers matched to your class and exam",
  "Ask by typing, photo, PDF, document or voice",
  "Conversations saved and searchable",
];

function rupees(paise: number) {
  return `₹${Math.round(paise / 100)}`;
}

export default function UpgradePage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  /** The plan currently being paid for, so only its button shows a spinner. */
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    /**
     * Loaded on mount rather than on click. It comes from Razorpay's CDN
     * and can take a second or two - doing it lazily would make the
     * student wait after pressing the button, which reads as broken.
     */
    if (!document.getElementById("razorpay-checkout")) {
      const script = document.createElement("script");
      script.id = "razorpay-checkout";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function load() {
    const me = await apiFetch<{ plan: { status: string } }>("/api/users/me");

    // Already paid, or an admin - nothing to buy here.
    if (me.ok && (me.data.plan.status === "ACTIVE" || me.data.plan.status === "EXEMPT")) {
      router.replace("/chat");
      return;
    }

    /**
     * Plans come from the server rather than being hardcoded here, so
     * adding or repricing one means changing a single file on the
     * backend - not this page too.
     */
    const result = await apiFetch<{ plans: Plan[] }>("/api/payments/plans");
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setPlans(result.data.plans);
  }

  async function handleSubscribe(plan: Plan) {
    setError("");
    setSubscribingTo(plan.code);

    const result = await apiFetch<SubscribeResponse>("/api/payments/subscribe", {
      method: "POST",
      body: JSON.stringify({ planCode: plan.code }),
    });

    if (!result.ok) {
      setSubscribingTo(null);
      setError(result.error.message);
      return;
    }

    if (!window.Razorpay) {
      setSubscribingTo(null);
      setError("Payment window couldn't load. Please refresh and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: result.data.keyId,
      subscription_id: result.data.subscriptionId,
      name: "QRI",
      description: `${result.data.planName} plan`,
      theme: { color: "#1D7EF2" },
      /**
       * Called when Razorpay's window reports success. This does NOT
       * activate the plan - only the signature-verified webhook does.
       * It just moves the student along; /chat re-checks, since the
       * webhook can land a moment after this callback.
       */
      handler: () => router.replace("/chat"),
      modal: {
        // Student closed the window without paying.
        ondismiss: () => setSubscribingTo(null),
      },
    });

    checkout.open();
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Choose your plan
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cancel any time. You keep access until the period you&apos;ve paid for ends.
            </p>
          </div>

          {error && <p className="mt-6 text-center text-sm text-destructive">{error}</p>}

          {loading ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">Loading plans...</p>
          ) : (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => {
                const isBusy = subscribingTo === plan.code;
                const anyBusy = subscribingTo !== null;

                return (
                  <div
                    key={plan.code}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                      plan.recommended
                        ? "border-[var(--brand-blue)] shadow-lg shadow-blue-500/10"
                        : "border-border"
                    }`}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand-blue)] px-3 py-1 text-[11px] font-semibold text-white">
                        Most popular
                      </span>
                    )}

                    <p className="text-sm font-semibold">{plan.name}</p>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{rupees(plan.amountPaise)}</span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-[var(--brand-teal)]">
                      {plan.questionLimit.toLocaleString("en-IN")} questions a month
                    </p>

                    <ul className="mt-5 flex-1 space-y-2.5">
                      {SHARED_FEATURES.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-teal)]" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan)}
                      /**
                       * Every button disables while any payment is in
                       * progress. Two checkouts open at once would
                       * create two subscriptions.
                       */
                      disabled={anyBusy}
                      className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                        plan.recommended
                          ? "bg-[var(--brand-blue)] text-white hover:opacity-90"
                          : "border border-border hover:bg-secondary"
                      }`}
                    >
                      {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isBusy ? "Opening..." : "Choose plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Pay with UPI, card or wallet. Secured by Razorpay.
          </p>
        </div>
      </main>
    </div>
  );
}