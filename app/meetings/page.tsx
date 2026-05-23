"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { getToken, clearToken } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/useToast";

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    authFetch<any[]>("/api/meetings")
      .then(setMeetings)
      .catch((err) => {
        showToast(err.message, "error");
        if (err.message.toLowerCase().includes("unauthorized")) {
          clearToken();
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Meeting history</h1>
              <p className="mt-2 text-slate-600">
                Review your generated MOMs and send follow-up emails again.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              New meeting
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">
            <div className="h-28 rounded-[1.75rem] bg-slate-100" />
            <div className="h-28 rounded-[1.75rem] bg-slate-100" />
          </div>
        ) : meetings.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            No meetings available yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <div
                key={meeting._id}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      {meeting.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(meeting.date).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={meeting.emailStatus} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                  {meeting.participants?.map((participant: any) => (
                    <span
                      key={participant.email}
                      className="rounded-full bg-slate-100 px-3 py-1"
                    >
                      {participant.name}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/meetings/${meeting._id}`)}
                    className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
