"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { ActionItemCard } from "@/components/ActionItemCard";
import { EmailModal } from "@/components/EmailModal";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/useToast";

interface ActionItem {
  _id: string;
  task: string;
  assignee: string;
  assigneeEmail: string;
  dueDate?: string;
  status: string;
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
  rawTranscript: string;
  summary: string;
  decisions: string[];
  participants: { name: string; email: string }[];
  emailStatus: string;
  momStatus?: "manual" | "scheduled" | "recording" | "processing" | "generated" | "failed";
  momError?: string;
  momSentAt?: string;
  actionItems: ActionItem[];
}

export default function MeetingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [sending, setSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasLoadedMeeting = useRef(false);
  const lastMomStatus = useRef<string | undefined>(undefined);
  const { showToast } = useToast();

  const loadMeeting = useCallback(async () => {
    const data = await authFetch<Meeting>(`/api/meetings/${id}`);
    if (
      hasLoadedMeeting.current &&
      lastMomStatus.current !== "generated" &&
      data.momStatus === "generated" &&
      data.rawTranscript
    ) {
      showToast("Transcript and MOM are ready.", "success");
    }

    hasLoadedMeeting.current = true;
    lastMomStatus.current = data.momStatus;
    setMeeting(data);
    return data;
  }, [id, showToast]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    loadMeeting()
      .catch((err) => showToast(err.message, "error"));
  }, [loadMeeting, router, showToast]);

  useEffect(() => {
    const shouldPoll =
      meeting &&
      ["scheduled", "recording", "processing", "failed"].includes(meeting.momStatus || "") &&
      !meeting.summary;

    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      loadMeeting().catch((err) => showToast(err.message, "error"));
    }, 10000);

    return () => window.clearInterval(timer);
  }, [loadMeeting, meeting, showToast]);

  const sendEmail = async () => {
    setSending(true);
    try {
      await authFetch(`/api/email/send/${id}`, { method: "POST" });
      setMeeting((current) =>
        current
          ? {
              ...current,
              emailStatus: "sent",
              momSentAt: new Date().toISOString(),
            }
          : current,
      );
      showToast("MOM email sent successfully.", "success");
      setIsModalOpen(false);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSending(false);
    }
  };

  const updateActionStatus = async (actionId: string, status: string) => {
    try {
      await authFetch(`/api/actions/${actionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMeeting((current) =>
        current
          ? {
              ...current,
              actionItems: current.actionItems.map((item) =>
                item._id === actionId ? { ...item, status } : item,
              ),
            }
          : current,
      );
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  if (!meeting) {
    return (
      <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl">
          Loading meeting details…
        </div>
      </main>
    );
  }

  const isMomPending =
    ["scheduled", "recording", "processing"].includes(meeting.momStatus || "") ||
    (!meeting.summary && meeting.momStatus !== "failed");
  const isMomFailed = meeting.momStatus === "failed";
  const isMomReady = meeting.momStatus === "generated" && !!meeting.rawTranscript;

  return (
    <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{meeting.title}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {new Date(meeting.date).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
                {meeting.participants.map((participant) => (
                  <span
                    key={participant.email}
                    className="rounded-full bg-slate-100 px-3 py-1"
                  >
                    {participant.name}
                  </span>
                ))}
              </div>
            </div>
            <StatusBadge status={meeting.emailStatus} />
          </div>

          {isMomPending && (
            <div className="mt-8 rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6">
              <h2 className="text-xl font-semibold text-blue-950">
                MOM is being generated
              </h2>
              <p className="mt-3 text-sm text-blue-800">
                The Recall bot will send the transcript after the meeting ends. This page refreshes automatically while the summary, decisions, and action items are prepared.
              </p>
            </div>
          )}

          {isMomFailed && (
            <div className="mt-8 rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6">
              <h2 className="text-xl font-semibold text-rose-950">
                Automatic MOM generation failed
              </h2>
              <p className="mt-3 text-sm text-rose-800">
                {meeting.momError || "Please check the backend logs and Recall webhook delivery."}
              </p>
            </div>
          )}

          {isMomReady && (
            <div className="mt-8 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-xl font-semibold text-emerald-950">
                Transcript ready
              </h2>
              <p className="mt-3 text-sm text-emerald-800">
                Transcript, summary, decisions, and action items are filled. Participant emails are saved, and MOM email sending is still manual.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold">Transcript</h2>
              <pre className="mt-4 max-h-80 whitespace-pre-wrap overflow-auto rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
                {meeting.rawTranscript || "Transcript will appear here after the meeting ends."}
              </pre>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold">Summary</h2>
              <p className="mt-4 text-slate-700">
                {meeting.summary || "Summary will appear here after the meeting ends."}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold">Decisions</h2>
              {meeting.decisions.length > 0 ? (
                <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
                  {meeting.decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-slate-700">
                  Decisions will appear here after generation completes.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Action items</h2>
              <p className="mt-2 text-sm text-slate-600">
                Track who owns each task and update progress.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!meeting.summary || isMomPending}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Send MOM email
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {meeting.actionItems.length > 0 ? (
              meeting.actionItems.map((action) => (
                <ActionItemCard
                  key={action._id}
                  task={action.task}
                  assignee={action.assignee}
                  dueDate={action.dueDate}
                  status={action.status}
                  onStatusChange={(status) =>
                    updateActionStatus(action._id, status)
                  }
                />
              ))
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                Action items will appear here after generation completes.
              </div>
            )}
          </div>
        </section>
      </div>

      <EmailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={sendEmail}
        participants={meeting.participants}
        sending={sending}
      />

      {/* Shared toast provider renders notifications globally */}
    </main>
  );
}
