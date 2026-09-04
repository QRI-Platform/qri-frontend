"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import { apiFetch } from "@/lib/api";

interface PlanInfo {
  status: string;
  name: string | null;
  questionLimit: number | null;
}

interface SubscribeResponse {
  subscriptionId: string;
  keyId: string;
  planName: string;
  amountPaise: number;
}

/**
 * Razorpay's checkout is loaded from their CDN and attaches itself to
 * window. TypeScript doesn't know about it, so it's declared here.
 */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const FEATURES = [
  "150 questions every month",
  "Answers matched to your class and exam",
  "Ask by typing, photo, PDF, document or voice",
  "Your conversations saved and searchable",
];

export default function UpgradePage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;

    /**
     * Loaded on mount rather than on click. It comes from Razorpay's CDN
     * and can take a second or two - doing it lazily would make the
     * student wait after pressing the button, which feels broken.
     */
    if (!document.getElementById("razorpay-checkout")) {
      const script = document.createElement("script");
      script.id = "razorpay-checkout";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    void loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function loadPlan() {
    const result = await apiFetch<{ plan: PlanInfo }>("/api/users/me");
    setLoading(false);
    if (!result.ok) return;

    // Already paid, or an admin - nothing to buy here.
    if (result.data.plan.status === "ACTIVE" || result.data.plan.status === "EXEMPT") {
      router.replace("/chat");
      return;
    }
    setPlan(result.data.plan);
  }

  async function handleSubscribe() {
    setError("");
    setSubscribing(true);

    const result = await apiFetch<SubscribeResponse>("/api/payments/subscribe", {
      method: "POST",
    });

    if (!result.ok) {
      setSubscribing(false);
      setError(result.error.message);
      return;
    }

    if (!window.Razorpay) {
      setSubscribing(false);
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
       * Called when Razorpay's window reports success. Note this does
       * NOT activate the plan - only the signature-verified webhook
       * does that. This just moves the student along and re-checks.
       *
       * The webhook can arrive a moment later than this callback, so
       * the chat page may briefly still see no plan. That's why it
       * re-reads rather than assuming.
       */
      handler: () => {
        router.replace("/chat");
      },
      modal: {
        // Student closed the window without paying.
        ondismiss: () => setSubscribing(false),
      },
    });

    checkout.open();
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="w-full max-w-md">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-[var(--brand-teal)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-teal)]">
                Early Bird
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                Start learning with QRI
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                One simple plan. Cancel whenever you like.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">₹9</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Renews automatically. Cancel any time.
              </p>

              <ul className="mt-6 space-y-3">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-teal)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {error && <p className="mt-5 text-sm text-destructive">{error}</p>}

              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {subscribing && <Loader2 className="h-4 w-4 animate-spin" />}
                {subscribing ? "Opening payment..." : "Subscribe for ₹9/month"}
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Pay with UPI, card or wallet. Secured by Razorpay.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}