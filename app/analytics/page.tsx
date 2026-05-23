"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/useToast";

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  byAssignee: Record<string, number>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    authFetch<Stats>("/api/actions/stats")
      .then(setStats)
      .catch((err) => {
        showToast(err.message, "error");
      });
  }, []);

  if (!stats) {
    return (
      <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-10 shadow-xl">
          <p className="text-base text-slate-600">Loading analytics…</p>
        </div>
      </main>
    );
  }

  const percentage = (value: number) =>
    stats.total ? Math.round((value / stats.total) * 100) : 0;

  return (
    <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] bg-white p-10 shadow-xl">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">Activity analytics</h1>
            <p className="text-slate-600">
              Monitor action item progress across teams and meetings.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { label: "Open", value: stats.open, badge: "open" },
              {
                label: "In progress",
                value: stats.inProgress,
                badge: "in_progress",
              },
              { label: "Done", value: stats.done, badge: "done" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 p-6"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <p className="mt-4 text-4xl font-semibold text-slate-950">
                  {item.value}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {percentage(item.value)}% of total
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">Assignee distribution</h2>
            <div className="space-y-4">
              {Object.entries(stats.byAssignee).map(([name, count]) => (
                <div
                  key={name}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{name}</p>
                    <StatusBadge status={count === 0 ? "pending" : "open"} />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-950"
                      style={{ width: `${percentage(count)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
