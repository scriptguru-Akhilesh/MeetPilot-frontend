"use client";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/useToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";

const formSchema = z.object({
  title: z.string().min(3, "Meeting title is required"),
  date: z.string().optional(),
  participants: z
    .array(z.object({ name: z.string().min(2), email: z.string().email() }))
    .min(1, "Add at least one participant"),
  transcript: z.string().min(10, "Transcript is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 10),
      participants: [{ name: "", email: "" }],
      transcript: "",
    },
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        const meetingsData = await authFetch<any[]>("/api/meetings");
        setMeetings(meetingsData);
        const actionsStats = await authFetch<{
          open: number;
          inProgress: number;
          done: number;
        }>("/api/actions/stats");
        setStats(actionsStats);
      } catch (err) {
        if ((err as Error).message.toLowerCase().includes("unauthorized")) {
          clearToken();
          router.push("/login");
          return;
        }
        showToast((err as Error).message, "error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  const meetingCount = meetings.length;

  const onSubmit = async (values: FormValues) => {
    if (!values.transcript.trim()) {
      showToast("Please enter a transcript before generating MOM.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append(
      "date",
      values.date || new Date().toISOString().slice(0, 10),
    );
    formData.append("participants", JSON.stringify(values.participants));
    formData.append("transcript", values.transcript);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/meetings`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload?.error || "Unable to generate meeting");
      showToast("MOM generated successfully.", "success");
      router.push(`/meetings/${payload.meeting._id}`);
      reset();
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  };

  const recentMeetings = useMemo(() => meetings.slice(0, 4), [meetings]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-8">
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold">Your meeting HQ</h1>
            <p className="max-w-2xl text-slate-600">
              Generate MOM, assign tasks, and send automated summary emails from
              one place.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Meetings</p>
              <p className="mt-4 text-3xl font-semibold">{meetingCount}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Open actions</p>
              <p className="mt-4 text-3xl font-semibold">{stats.open}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-500">Completed tasks</p>
              <p className="mt-4 text-3xl font-semibold">{stats.done}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Generate new MOM</h2>
                <p className="mt-2 text-slate-600">
                  Upload your transcript and let AI create action items
                  automatically.
                </p>
              </div>
              <StatusBadge status="pending" />
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-900">
                  Meeting title
                  <input
                    {...register("title")}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="Sprint planning"
                  />
                  {errors.title && (
                    <p className="text-sm text-rose-600">
                      {errors.title.message}
                    </p>
                  )}
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-900">
                  Date
                  <input
                    type="date"
                    {...register("date")}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 text-sm font-medium text-slate-900">
                  Participants
                </div>
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-2">
                    <input
                      {...register(`participants.${index}.name` as const)}
                      placeholder="Name"
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                    <input
                      {...register(`participants.${index}.email` as const)}
                      placeholder="email@example.com"
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                ))}
                {errors.participants && (
                  <p className="mt-3 text-sm text-rose-600">
                    {errors.participants.message}
                  </p>
                )}
              </div>

              <label className="space-y-2 text-sm font-medium text-slate-900">
                Transcript
                <textarea
                  {...register("transcript")}
                  rows={8}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Paste meeting transcript here..."
                />
                {errors.transcript && (
                  <p className="text-sm text-rose-600">
                    {errors.transcript.message}
                  </p>
                )}
              </label>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Generate your summary, decisions, and action items in one
                  flow.
                </p>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Generating…" : "Generate MOM"}
                </Button>
              </div>
            </form>
          </section>

          <section className="rounded-[2rem] bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Recent meetings</h2>
                <p className="mt-2 text-slate-600">
                  Quick access to your latest MOM summaries and email status.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-[1.5rem] bg-slate-100" />
                  <div className="h-24 rounded-[1.5rem] bg-slate-100" />
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-center text-slate-600">
                  No meetings yet. Generate a MOM to get started.
                </div>
              ) : (
                recentMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="rounded-[1.75rem] border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
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
                      {meeting.participants?.map((p: any) => (
                        <span
                          key={p.email}
                          className="rounded-full bg-slate-100 px-3 py-1"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-5 text-sm font-semibold text-slate-950 transition hover:text-slate-700"
                      onClick={() => router.push(`/meetings/${meeting._id}`)}
                    >
                      View meeting details →
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Toasts are rendered by the shared ToastProvider */}
    </main>
  );
}
