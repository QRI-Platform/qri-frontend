"use client";

import { useEffect, useState } from "react";
import { Search, Users, UserPlus, MessagesSquare, MessageSquareText } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { useRequireAdmin } from "@/lib/use-require-admin";
import { apiFetch } from "@/lib/api";

interface Stats {
  totalStudents: number;
  newThisWeek: number;
  totalChats: number;
  totalMessages: number;
  byGrade: { grade: number | null; count: number }[];
  byExamTrack: { examTrack: string; count: number }[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  grade: number | null;
  examTrack: string;
  provider: string;
  createdAt: string;
  chatCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const EXAM_LABELS: Record<string, string> = {
  NEET: "NEET",
  IIT_JEE: "IIT-JEE",
  NDA: "NDA",
  NONE: "No exam",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPage() {
  const status = useRequireAdmin();

  const [stats, setStats] = useState<Stats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");

  // Debounce the search box - firing a request on every keystroke would
  // hammer the API for no benefit.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "allowed") return;
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (status !== "allowed") return;
    void loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, search]);

  async function loadStats() {
    const result = await apiFetch<Stats>("/api/admin/stats");
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setStats(result.data);
  }

  async function loadStudents() {
    setLoadingStudents(true);
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) query.set("search", search);

    const result = await apiFetch<{ students: Student[]; pagination: Pagination }>(
      `/api/admin/students?${query.toString()}`,
    );
    setLoadingStudents(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setStudents(result.data.students);
    setPagination(result.data.pagination);
  }

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  const maxGradeCount = Math.max(1, ...(stats?.byGrade.map((g) => g.count) ?? [1]));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            An overview of students and activity across QRI.
          </p>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Students"
              value={stats?.totalStudents}
            />
            <StatCard
              icon={<UserPlus className="h-4 w-4" />}
              label="New this week"
              value={stats?.newThisWeek}
            />
            <StatCard
              icon={<MessagesSquare className="h-4 w-4" />}
              label="Conversations"
              value={stats?.totalChats}
            />
            <StatCard
              icon={<MessageSquareText className="h-4 w-4" />}
              label="Messages"
              value={stats?.totalMessages}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Students by class</h2>
              {stats && stats.byGrade.length > 0 ? (
                <div className="mt-4 space-y-2.5">
                  {stats.byGrade.map((g) => (
                    <div key={String(g.grade)} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">
                        {g.grade === null ? "Not set" : `Class ${g.grade}`}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-[var(--brand-blue)]"
                          style={{ width: `${(g.count / maxGradeCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-semibold">
                        {g.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Exam tracks</h2>
              {stats && stats.byExamTrack.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {stats.byExamTrack.map((e) => (
                    <div
                      key={e.examTrack}
                      className="rounded-xl border border-border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {EXAM_LABELS[e.examTrack] ?? e.examTrack}
                      </span>
                      <span className="ml-2 font-semibold">{e.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No data yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold">
                Students
                {pagination && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({pagination.total})
                  </span>
                )}
              </h2>
              <div className="relative sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name or email"
                  className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[var(--brand-blue)]"
                />
              </div>
            </div>

            {loadingStudents ? (
              <p className="p-5 text-sm text-muted-foreground">Loading students...</p>
            ) : students.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                {search ? "No students match that search." : "No students yet."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Class</th>
                      <th className="px-5 py-3 font-medium">Exam</th>
                      <th className="px-5 py-3 font-medium">Chats</th>
                      <th className="px-5 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3">
                          {s.grade === null ? (
                            <span className="text-muted-foreground">&mdash;</span>
                          ) : (
                            s.grade
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                          {EXAM_LABELS[s.examTrack] ?? s.examTrack}
                        </td>
                        <td className="px-5 py-3">{s.chatCount}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                          {formatDate(s.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border p-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:bg-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value ?? "—"}</p>
    </div>
  );
}