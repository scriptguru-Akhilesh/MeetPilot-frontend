"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/useToast";
import { CalendarDays, Plus, Users } from "lucide-react";

interface MeetingParticipant {
  name: string;
  email: string;
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
  emailStatus: string;
  participants?: MeetingParticipant[];
}

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    authFetch<Meeting[]>("/api/meetings")
      .then(setMeetings)
      .catch((err) => {
        showToast(err.message, "error");
        if (err.message.toLowerCase().includes("unauthorized")) {
          clearToken();
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router, showToast]);

  return (
    <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <section className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[var(--muted-bg)]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">
                Meetings
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Meeting history</h1>
              <p className="mt-2 max-w-2xl text-[var(--muted)]">
                Review your generated MOMs and send follow-up emails again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="relative inline-flex items-center justify-center gap-2 rounded-lg primary-gradient px-5 py-3 text-sm font-semibold text-[var(--background)] shadow-sm transition hover:opacity-95 cursor-pointer"
            >
              <Plus size={17} />
              New meeting
            </button>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-4">
            <div className="h-28 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--muted-bg)]" />
            <div className="h-28 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--muted-bg)]" />
          </div>
        ) : meetings.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-[var(--shadow)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--muted-bg)] text-[var(--secondary)]">
              <CalendarDays size={22} />
            </div>
            <p className="mt-4 font-semibold text-[var(--foreground)]">No meetings available yet.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Schedule a meeting or generate a MOM from the dashboard.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <article
                key={meeting._id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] transition hover:border-[var(--secondary)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-[var(--foreground)]">
                      {meeting.title}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                      <CalendarDays size={15} />
                      {new Date(meeting.date).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={meeting.emailStatus} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                  {meeting.participants?.length ? (
                    meeting.participants.map((participant) => (
                    <span
                      key={participant.email}
                      className="rounded-lg bg-[var(--muted-bg)] px-3 py-1"
                    >
                      {participant.name}
                    </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg bg-[var(--muted-bg)] px-3 py-1">
                      <Users size={14} />
                      No participants listed
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/meetings/${meeting._id}`)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--secondary)] hover:text-[var(--secondary)] cursor-pointer"
                  >
                    View details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
