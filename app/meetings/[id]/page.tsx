"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { ActionItemCard } from "@/components/ActionItemCard";
import { EmailModal } from "@/components/EmailModal";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/useToast";
import { LoadingDots } from "@/components/Spinner"

interface ActionItem {
  _id: string;
  task: string;
  assignee: string;
  assigneeEmail?: string;
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
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editValues, setEditValues] = useState({
    title: "",
    date: "",
    rawTranscript: "",
    summary: "",
    decisionsText: "",
  });
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
    setEditValues({
      title: data.title || "",
      date: data.date ? new Date(data.date).toISOString().slice(0, 10) : "",
      rawTranscript: data.rawTranscript || "",
      summary: data.summary || "",
      decisionsText: data.decisions?.join("\n") || "",
    });
    return data;
  }, [id, showToast]);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    const loadTimer = window.setTimeout(() => {
      loadMeeting().catch((err) => showToast(err.message, "error"));
    }, 0);

    return () => window.clearTimeout(loadTimer);
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

  const sendEmail = async (recipientEmails: string[]) => {
    if (recipientEmails.length === 0) {
      showToast("Select at least one recipient.", "error");
      return;
    }

    setSending(true);
    try {
      await authFetch(`/api/email/send/${id}`, {
        method: "POST",
        body: JSON.stringify({ recipientEmails }),
      });
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

  const saveMeetingEdits = async () => {
    if (!meeting) return;

    const nextMeeting = {
      ...meeting,
      title: editValues.title.trim(),
      date: editValues.date,
      rawTranscript: editValues.rawTranscript,
      summary: editValues.summary,
      decisions: editValues.decisionsText
        .split("\n")
        .map((decision) => decision.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      const updated = await authFetch<Partial<Meeting>>(`/api/meetings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: nextMeeting.title,
          date: nextMeeting.date,
          rawTranscript: nextMeeting.rawTranscript,
          summary: nextMeeting.summary,
          decisions: nextMeeting.decisions,
        }),
      });

      setMeeting({ ...nextMeeting, ...updated });
      setIsEditing(false);
      showToast("Meeting details updated.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelMeetingEdits = () => {
    if (!meeting) return;
    setEditValues({
      title: meeting.title || "",
      date: meeting.date ? new Date(meeting.date).toISOString().slice(0, 10) : "",
      rawTranscript: meeting.rawTranscript || "",
      summary: meeting.summary || "",
      decisionsText: meeting.decisions?.join("\n") || "",
    });
    setIsEditing(false);
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
      <LoadingDots />
    );
  }

  const isMomPending =
    ["scheduled", "recording", "processing"].includes(meeting.momStatus || "") ||
    (!meeting.summary && meeting.momStatus !== "failed");
  const isMomFailed = meeting.momStatus === "failed";
  const isMomReady = meeting.momStatus === "generated" && !!meeting.rawTranscript;

  return (
    <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1300px] space-y-6">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">
                Meeting details
              </p>
              {isEditing ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
                  <input
                    value={editValues.title}
                    onChange={(event) =>
                      setEditValues((current) => ({ ...current, title: event.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-2xl font-semibold outline-none focus:border-[var(--secondary)]"
                    placeholder="Meeting title"
                  />
                  <input
                    type="date"
                    value={editValues.date}
                    onChange={(event) =>
                      setEditValues((current) => ({ ...current, date: event.target.value }))
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-semibold">{meeting.title}</h1>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {new Date(meeting.date).toLocaleDateString()}
                  </p>
                </>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                {meeting.participants.map((participant) => (
                  <span
                    key={participant.email}
                    className="rounded-lg bg-[var(--muted-bg)] px-3 py-1"
                  >
                    {participant.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={meeting.emailStatus} />
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelMeetingEdits}
                    disabled={saving}
                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--secondary)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveMeetingEdits}
                    disabled={saving}
                    className="cursor-pointer rounded-lg primary-gradient px-4 py-2 text-sm font-semibold text-[var(--background)] transition hover:opacity-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save edits"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--secondary)] hover:text-[var(--secondary)]"
                >
                  Edit details
                </button>
              )}
            </div>
          </div>

          {isMomPending && (
            <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:bg-blue-500/10">
              <h2 className="text-xl font-semibold text-blue-950 dark:text-blue-100">
                MOM is being generated
              </h2>
              <p className="mt-3 text-sm text-blue-800 dark:text-blue-200">
                The Recall bot will send the transcript after the meeting ends. This page refreshes automatically while the summary, decisions, and action items are prepared.
              </p>
            </div>
          )}

          {isMomFailed && (
            <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-6 dark:bg-rose-500/10">
              <h2 className="text-xl font-semibold text-rose-950 dark:text-rose-100">
                Automatic MOM generation failed
              </h2>
              <p className="mt-3 text-sm text-rose-800 dark:text-rose-200">
                {meeting.momError || "Please check the backend logs and Recall webhook delivery."}
              </p>
            </div>
          )}

          {isMomReady && (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:bg-emerald-500/10">
              <h2 className="text-xl font-semibold text-emerald-950 dark:text-emerald-100">
                Transcript ready
              </h2>
              <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">
                Transcript, summary, decisions, and action items are filled. Participant emails are saved, and MOM email sending is still manual.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-6">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-6">
              <h2 className="text-xl font-semibold">Transcript</h2>
              {isEditing ? (
                <textarea
                  value={editValues.rawTranscript}
                  onChange={(event) =>
                    setEditValues((current) => ({ ...current, rawTranscript: event.target.value }))
                  }
                  rows={10}
                  className="mt-4 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--secondary)]"
                  placeholder="Transcript will appear here after the meeting ends."
                />
              ) : (
                <pre className="mt-4 max-h-80 whitespace-pre-wrap overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--foreground)]">
                  {meeting.rawTranscript || "Transcript will appear here after the meeting ends."}
                </pre>
              )}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-6">
              <h2 className="text-xl font-semibold">Summary</h2>
              {isEditing ? (
                <textarea
                  value={editValues.summary}
                  onChange={(event) =>
                    setEditValues((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={6}
                  className="mt-4 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--secondary)]"
                  placeholder="Summary will appear here after the meeting ends."
                />
              ) : (
                <p className="mt-4 text-[var(--muted)]">
                  {meeting.summary || "Summary will appear here after the meeting ends."}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-6">
              <h2 className="text-xl font-semibold">Decisions</h2>
              {isEditing ? (
                <textarea
                  value={editValues.decisionsText}
                  onChange={(event) =>
                    setEditValues((current) => ({ ...current, decisionsText: event.target.value }))
                  }
                  rows={6}
                  className="mt-4 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--foreground)] outline-none focus:border-[var(--secondary)]"
                  placeholder="Add one decision per line."
                />
              ) : meeting.decisions.length > 0 ? (
                <ul className="mt-4 list-disc space-y-3 pl-5 text-[var(--muted)]">
                  {meeting.decisions.map((decision, index) => (
                    <li key={index}>{decision}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-[var(--muted)]">
                  Decisions will appear here after generation completes.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Action items</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Track who owns each task and update progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={!meeting.summary || isMomPending}
              className="rounded-lg primary-gradient px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted-bg)] p-6 text-sm text-[var(--muted)]">
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
    </div>
  );
}
