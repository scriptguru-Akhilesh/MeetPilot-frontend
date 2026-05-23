"use client";
import { useEffect, useState } from "react";
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
  summary: string;
  decisions: string[];
  participants: { name: string; email: string }[];
  emailStatus: string;
  momSentAt?: string;
  actionItems: ActionItem[];
}

export default function MeetingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [sending, setSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    authFetch<Meeting>(`/api/meetings/${id}`)
      .then(setMeeting)
      .catch((err) => showToast(err.message, "error"));
  }, [id, router]);

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

          <div className="mt-8 grid gap-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold">Summary</h2>
              <p className="mt-4 text-slate-700">{meeting.summary}</p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold">Decisions</h2>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-700">
                {meeting.decisions.map((decision, index) => (
                  <li key={index}>{decision}</li>
                ))}
              </ul>
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
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Send MOM email
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {meeting.actionItems.map((action) => (
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
            ))}
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
