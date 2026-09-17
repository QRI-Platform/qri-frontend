"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Mail,
  ShieldCheck,
  User as UserIcon,
  School,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequireAuth } from "@/lib/use-require-auth";
import { apiFetch } from "@/lib/api";
import { clearToken } from "@/lib/auth-client";

const CLASSES = [6, 7, 8, 9, 10, 11, 12] as const;

const EXAM_TRACKS = [
  { key: "NONE", label: "None" },
  { key: "NEET", label: "NEET" },
  { key: "IIT_JEE", label: "IIT-JEE" },
  { key: "NDA", label: "NDA" },
] as const;

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  grade: number | null;
  examTrack: string;
  schoolName: string | null;
  city: string | null;
  phone: string | null;
  createdAt: string;
}

interface PlanInfo {
  status: string;
  name: string | null;
  price: string | null;
  expiresAt: string | null;
  questionsUsed: number;
  questionLimit: number | null;
  resetsAt: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Two initials for the avatar - avoids needing an uploaded photo. */
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const ready = useRequireAuth();
  const router = useRouter();

  // What the server currently has - used to work out what actually changed.
  const [original, setOriginal] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  // What's on screen right now.
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [examTrack, setExamTrack] = useState("NONE");
  const [schoolName, setSchoolName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!ready) return;
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function loadProfile() {
    setLoading(true);
    const result = await apiFetch<{ user: Profile; plan: PlanInfo }>("/api/users/me");
    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    const user = result.data.user;
    setOriginal(user);
    setPlan(result.data.plan);
    setName(user.name);
    setGrade(user.grade);
    setExamTrack(user.examTrack);
    setSchoolName(user.schoolName ?? "");
    setCity(user.city ?? "");
    setPhone(user.phone ?? "");
  }

  /** Empty input means "cleared", which the API takes as null. */
  function normalise(value: string) {
    return value.trim() === "" ? null : value.trim();
  }

  const hasChanges =
    original !== null &&
    (name.trim() !== original.name ||
      grade !== original.grade ||
      examTrack !== original.examTrack ||
      normalise(schoolName) !== original.schoolName ||
      normalise(city) !== original.city ||
      normalise(phone) !== original.phone);

  async function handleSave() {
    if (!original || !hasChanges) return;

    setError("");
    setSaved(false);
    setSaving(true);

    // Only what actually changed. Anything not sent is left untouched.
    const payload: Record<string, string | number | null> = {};
    if (name.trim() !== original.name) payload.name = name.trim();
    if (grade !== null && grade !== original.grade) payload.grade = grade;
    if (examTrack !== original.examTrack) payload.examTrack = examTrack;
    if (normalise(schoolName) !== original.schoolName) payload.schoolName = normalise(schoolName);
    if (normalise(city) !== original.city) payload.city = normalise(city);
    if (normalise(phone) !== original.phone) payload.phone = normalise(phone);

    const result = await apiFetch<{ user: Profile }>("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setOriginal(result.data.user);
    setSaved(true);
  }

  function handleLogout() {
    clearToken();
    // replace, not push - so the back button doesn't land them on a
    // page they're no longer authorised to see.
    router.replace("/login");
  }

  if (!ready) return null;

  const isAdmin = original?.role === "ADMIN";
  const used = plan?.questionsUsed ?? 0;
  const limit = plan?.questionLimit ?? null;
  const remaining = limit !== null ? Math.max(0, limit - used) : null;
  const percentUsed = limit !== null && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const runningLow = remaining !== null && limit !== null && remaining <= limit * 0.15;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          ) : (
            <>
              {/* --- Identity header --- */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-blue)] via-[var(--brand-navy)] to-[var(--brand-teal)] text-xl font-bold text-white shadow-lg shadow-blue-500/20">
                  {initials(original?.name ?? "")}
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                    {original?.name}
                  </h1>
                  <p className="truncate text-sm text-muted-foreground">{original?.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Member since {formatDate(original?.createdAt ?? null)}
                  </p>
                </div>
              </div>

              {/* --- Plan and usage --- */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Your plan</p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-lg font-bold">
                        {isAdmin ? "Admin access" : (plan?.name ?? "No plan")}
                      </span>
                      {!isAdmin && plan?.price && (
                        <span className="text-sm text-muted-foreground">{plan.price}/month</span>
                      )}
                    </p>
                  </div>

                  {!isAdmin && plan?.status === "ACTIVE" && (
                    <span className="rounded-full bg-[var(--brand-teal)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-teal)]">
                      Active
                    </span>
                  )}
                </div>

                {isAdmin ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Admin accounts have unlimited questions.
                  </p>
                ) : plan && limit !== null ? (
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-semibold">
                        {used.toLocaleString("en-IN")} of {limit.toLocaleString("en-IN")} questions
                        used
                      </span>
                      <span
                        className={
                          runningLow
                            ? "text-xs font-medium text-destructive"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {remaining?.toLocaleString("en-IN")} left
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all ${
                          runningLow ? "bg-destructive" : "bg-[var(--brand-blue)]"
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>

                    {plan.resetsAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Resets on {formatDate(plan.resetsAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      You need a plan to ask questions.
                    </p>
                    <Link
                      href="/upgrade"
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Sparkles className="h-4 w-4" />
                      Choose a plan
                    </Link>
                  </div>
                )}
              </div>

              {/* --- Editable details --- */}
              <div className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="text-sm font-bold">Your details</p>

                <div>
                  <label htmlFor="name" className="text-sm font-semibold">
                    Name
                  </label>
                  <div className="relative mt-2">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSaved(false);
                      }}
                      className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={original?.email ?? ""}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-muted-foreground outline-none"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Class</p>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {CLASSES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setGrade(c);
                          setSaved(false);
                        }}
                        className={`flex h-11 items-center justify-center rounded-xl border text-base font-bold transition ${
                          grade === c
                            ? "border-[var(--brand-blue)] bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                            : "border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Competitive exam</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXAM_TRACKS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setExamTrack(t.key);
                          setSaved(false);
                        }}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          examTrack === t.key
                            ? "border-[var(--brand-teal)] bg-[var(--brand-teal)]/10 text-[var(--brand-teal)]"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-sm font-semibold">School and contact</p>
                  <p className="mt-1 text-xs text-muted-foreground">Optional.</p>

                  <div className="mt-3 space-y-3">
                    <div className="relative">
                      <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => {
                          setSchoolName(e.target.value);
                          setSaved(false);
                        }}
                        placeholder="School name"
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
                      />
                    </div>

                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setSaved(false);
                        }}
                        placeholder="City"
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setSaved(false);
                        }}
                        placeholder="Phone number"
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--brand-blue)]"
                      />
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {saved && (
                  <p className="text-sm font-medium text-[var(--brand-teal)]">
                    Your changes have been saved.
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving || !name.trim()}
                  className="w-full rounded-xl bg-[var(--brand-blue)] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>

              {/* Only rendered for admins. Convenience, not security -
                  the backend refuses non-admins regardless. */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--brand-teal)] py-2.5 text-sm font-semibold text-[var(--brand-teal)] transition hover:bg-[var(--brand-teal)]/5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Open admin panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive/5"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}