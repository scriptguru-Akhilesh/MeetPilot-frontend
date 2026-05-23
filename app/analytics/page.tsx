"use client";

import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/useToast";
import { BarChart3, CalendarDays, CheckCircle2, Mail, Users } from "lucide-react";
import {LoadingDots} from"@/components/Spinner"
interface Stats {
  total?: number;
  open: number;
  inProgress: number;
  done: number;
  byAssignee: Record<string, number>;
}

interface Participant {
  name: string;
  email: string;
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
  emailStatus?: string;
  momStatus?: "manual" | "scheduled" | "recording" | "processing" | "generated" | "failed";
  participants?: Participant[];
}

interface AnalyticsData {
  stats: Stats;
  meetings: Meeting[];
}

const emptyStats: Stats = {
  open: 0,
  inProgress: 0,
  done: 0,
  byAssignee: {},
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([
      authFetch<Stats>("/api/actions/stats"),
      authFetch<Meeting[]>("/api/meetings"),
    ])
      .then(([stats, meetings]) => {
        setData({ stats: { ...emptyStats, ...stats }, meetings });
      })
      .catch((err) => {
        showToast(err.message, "error");
      });
  }, [showToast]);

  const analytics = useMemo(() => {
    if (!data) return null;

    const { meetings, stats } = data;
    const totalActions = stats.total ?? stats.open + stats.inProgress + stats.done;
    const generatedMeetings = meetings.filter((meeting) => meeting.momStatus === "generated").length;
    const failedMeetings = meetings.filter((meeting) => meeting.momStatus === "failed").length;
    const pendingMeetings = meetings.filter((meeting) =>
      ["scheduled", "recording", "processing"].includes(meeting.momStatus || ""),
    ).length;
    const sentEmails = meetings.filter((meeting) => meeting.emailStatus === "sent").length;
    const uniqueParticipants = new Set(
      meetings.flatMap((meeting) => meeting.participants?.map((participant) => participant.email) ?? []),
    ).size;
    const completionRate = totalActions ? Math.round((stats.done / totalActions) * 100) : 0;
    const emailRate = meetings.length ? Math.round((sentEmails / meetings.length) * 100) : 0;
    const momRate = meetings.length ? Math.round((generatedMeetings / meetings.length) * 100) : 0;
    const topAssignees = Object.entries(stats.byAssignee)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
    const recentMeetings = [...meetings]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalActions,
      generatedMeetings,
      failedMeetings,
      pendingMeetings,
      sentEmails,
      uniqueParticipants,
      completionRate,
      emailRate,
      momRate,
      topAssignees,
      recentMeetings,
    };
  }, [data]);

  if (!data || !analytics) {
    return (
      <LoadingDots />
    );
  }

  const { stats, meetings } = data;
  const actionRows = [
    { label: "Open", value: stats.open, status: "open" },
    { label: "In progress", value: stats.inProgress, status: "in_progress" },
    { label: "Done", value: stats.done, status: "done" },
  ];
  const percentOfActions = (value: number) =>
    analytics.totalActions ? Math.round((value / analytics.totalActions) * 100) : 0;

  return (
    <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">
                Analytics
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Workspace analytics</h1>
              <p className="mt-2 max-w-2xl text-[var(--muted)]">
                Real-time calculations from your meetings, MOM status, email delivery, participants, and action items.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm text-[var(--muted)]">
              <BarChart3 size={18} className="text-[var(--secondary)]" />
              {meetings.length} meetings analyzed
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total meetings", value: meetings.length, helper: `${analytics.momRate}% MOM generated`, icon: CalendarDays },
              { label: "Action completion", value: `${analytics.completionRate}%`, helper: `${stats.done}/${analytics.totalActions} tasks done`, icon: CheckCircle2 },
              { label: "Emails sent", value: analytics.sentEmails, helper: `${analytics.emailRate}% of meetings`, icon: Mail },
              { label: "Participants", value: analytics.uniqueParticipants, helper: "Unique attendee emails", icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--muted)]">{item.label}</p>
                    <Icon size={18} className="text-[var(--secondary)]" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-[var(--foreground)]">{item.value}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.helper}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold">Action item status</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {actionRows.map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--muted)]">{item.label}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-4 text-3xl font-semibold">{item.value}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-[var(--secondary)]"
                      style={{ width: `${percentOfActions(item.value)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {percentOfActions(item.value)}% of all actions
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-base font-semibold">Top assignees</h3>
              <div className="mt-4 space-y-3">
                {analytics.topAssignees.length ? (
                  analytics.topAssignees.map(([name, count]) => (
                    <div key={name} className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-[var(--foreground)]">{name}</p>
                        <p className="text-sm text-[var(--muted)]">{count} actions</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className="h-full rounded-full bg-[var(--secondary)]"
                          style={{ width: `${percentOfActions(count)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted-bg)] p-5 text-sm text-[var(--muted)]">
                    No assignee data yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
            <h2 className="text-xl font-semibold">MOM performance</h2>
            <div className="mt-5 space-y-4">
              {[
                { label: "Generated", value: analytics.generatedMeetings, percent: analytics.momRate, tone: "bg-emerald-500" },
                { label: "Pending", value: analytics.pendingMeetings, percent: meetings.length ? Math.round((analytics.pendingMeetings / meetings.length) * 100) : 0, tone: "bg-blue-500" },
                { label: "Failed", value: analytics.failedMeetings, percent: meetings.length ? Math.round((analytics.failedMeetings / meetings.length) * 100) : 0, tone: "bg-rose-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-sm text-[var(--muted)]">{item.value} meetings</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border)]">
                    <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percent}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{item.percent}% of meetings</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-base font-semibold">Recent meetings</h3>
              <div className="mt-4 space-y-3">
                {analytics.recentMeetings.length ? (
                  analytics.recentMeetings.map((meeting) => (
                    <div key={meeting._id} className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{meeting.title}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {new Date(meeting.date).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={meeting.emailStatus || "pending"} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted-bg)] p-5 text-sm text-[var(--muted)]">
                    No meetings yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
