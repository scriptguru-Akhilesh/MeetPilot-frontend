"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/useToast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledEvent {
  eventId: string;
  meetLink: string;
  calendarLink: string;
  startTime: string;
  endTime: string;
  title: string;
  participantCount: number;
  meetingId: string;
  botId: string | null;
  transcriptionEnabled: boolean;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const scheduleSchema = z.object({
  title: z.string().min(3, "Meeting title is required"),
  startTime: z.string().min(1, "Date and time is required"),
  durationMinutes: z.coerce.number().min(15),
  participants: z
    .array(z.object({ name: z.string().min(1), email: z.string().email() }))
    .min(1, "Add at least one participant"),
});

const momSchema = z.object({
  title: z.string().min(3, "Meeting title is required"),
  date: z.string().optional(),
  participants: z
    .array(z.object({ name: z.string().min(2), email: z.string().email() }))
    .min(1, "Add at least one participant"),
  transcript: z.string().min(10, "Transcript is required"),
});

type ScheduleValues = z.infer<typeof scheduleSchema>;
type MomValues = z.infer<typeof momSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Google Calendar state
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [scheduledEvent, setScheduledEvent] = useState<ScheduledEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "mom">("schedule");
  const notifiedReadyMeetingIds = useRef<Set<string>>(new Set());

  const { showToast } = useToast();

  // ─── Schedule form ──────────────────────────────────────────────────────────
  const {
    register: regSchedule,
    handleSubmit: handleSchedule,
    control: scheduleControl,
    formState: { errors: scheduleErrors, isSubmitting: isScheduling },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      startTime: "",
      durationMinutes: 60,
      participants: [{ name: "", email: "" }],
    },
  });

  const {
    fields: scheduleParticipants,
    append: appendScheduleParticipant,
    remove: removeScheduleParticipant,
  } = useFieldArray({ control: scheduleControl, name: "participants" });

  // ─── MOM form ───────────────────────────────────────────────────────────────
  const {
    register: regMom,
    handleSubmit: handleMom,
    control: momControl,
    formState: { errors: momErrors, isSubmitting: isMomSubmitting },
    reset: resetMom,
  } = useForm<MomValues>({
    resolver: zodResolver(momSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 10),
      participants: [{ name: "", email: "" }],
      transcript: "",
    },
  });

  const {
    fields: momParticipants,
    append: appendMomParticipant,
    remove: removeMomParticipant,
  } = useFieldArray({ control: momControl, name: "participants" });

  const loadDashboard = useCallback(
    async (notifyReady = false) => {
      try {
        const [meetingsData, actionsStats, calendarStatus] = await Promise.all([
          authFetch<any[]>("/api/meetings"),
          authFetch<{ open: number; inProgress: number; done: number }>("/api/actions/stats"),
          authFetch<{ connected: boolean }>("/api/calendar/status"),
        ]);

        const readyMeetings = meetingsData.filter(
          (meeting) => meeting.momStatus === "generated" && meeting.rawTranscript,
        );

        if (notifyReady) {
          const newlyReady = readyMeetings.find(
            (meeting) => !notifiedReadyMeetingIds.current.has(meeting._id),
          );
          if (newlyReady) {
            showToast(`Transcript ready: ${newlyReady.title}`, "success");
          }
        }

        readyMeetings.forEach((meeting) => {
          notifiedReadyMeetingIds.current.add(meeting._id);
        });

        setMeetings(meetingsData);
        setStats(actionsStats);
        setCalendarConnected(calendarStatus.connected);
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
    },
    [router, showToast],
  );

  // ─── Load data on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    if (searchParams.get("calendar") === "connected") {
      showToast("Google Calendar connected successfully!", "success");
      setCalendarConnected(true);
      router.replace("/dashboard");
    }

    loadDashboard(false);
  }, [loadDashboard, router, searchParams, showToast]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadDashboard(true);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  // ─── Connect Google Calendar ────────────────────────────────────────────────
  async function connectCalendar() {
    try {
      const data = await authFetch<{ url: string }>("/api/calendar/connect");
      window.location.href = data.url;
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  // ─── Disconnect Google Calendar ─────────────────────────────────────────────
  async function disconnectCalendar() {
    if (!confirm("Disconnect Google Calendar? You won't be able to schedule meetings or generate Meet links.")) return;
    setIsDisconnecting(true);
    try {
      await authFetch("/api/calendar/disconnect", { method: "DELETE" });
      setCalendarConnected(false);
      showToast("Google Calendar disconnected.", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setIsDisconnecting(false);
    }
  }

  // ─── Schedule meeting ───────────────────────────────────────────────────────
  async function onSchedule(values: ScheduleValues) {
    try {
      const event = await authFetch<ScheduledEvent>("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          startTime: new Date(values.startTime).toISOString(),
          durationMinutes: values.durationMinutes,
          participants: values.participants,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      setScheduledEvent(event);
      showToast(
        event.transcriptionEnabled
          ? "Meeting scheduled. MOM will generate automatically after it ends."
          : "Meeting scheduled, but automatic transcription is not enabled.",
        event.transcriptionEnabled ? "success" : "error",
      );
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  // ─── Generate MOM ───────────────────────────────────────────────────────────
  async function onMomSubmit(values: MomValues) {
    if (!values.transcript.trim()) {
      showToast("Please enter a transcript before generating MOM.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("date", values.date || new Date().toISOString().slice(0, 10));
    formData.append("participants", JSON.stringify(values.participants));
    formData.append("transcript", values.transcript);

    if (scheduledEvent) {
      formData.append("calendarEventId", scheduledEvent.eventId);
      formData.append("meetLink", scheduledEvent.meetLink);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/meetings`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Unable to generate meeting");
      showToast("MOM generated successfully.", "success");
      router.push(`/meetings/${payload.meeting._id}`);
      resetMom();
      setScheduledEvent(null);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  const meetingCount = meetings.length;
  const recentMeetings = useMemo(() => meetings.slice(0, 4), [meetings]);
  const readyMeetings = useMemo(
    () =>
      meetings.filter(
        (meeting) => meeting.momStatus === "generated" && meeting.rawTranscript,
      ),
    [meetings],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-8">

        {/* Header stats */}
        <div className="flex flex-col gap-3 rounded-[2rem] bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
            <h1 className="text-3xl font-semibold">Your meeting HQ</h1>
            <p className="max-w-2xl text-slate-600">
              Schedule meetings, generate MOM, assign tasks, and send automated summary emails.
            </p>
          </div>

          {/* Google Calendar connect/disconnect banner */}
          {calendarConnected === false && (
            <div className="flex items-center justify-between rounded-[1.75rem] border border-blue-200 bg-blue-50 px-6 py-4">
              <div>
                <p className="font-medium text-blue-900">Connect Google Calendar</p>
                <p className="text-sm text-blue-700">
                  Schedule meetings and generate Meet links automatically.
                </p>
              </div>
              <button
                onClick={connectCalendar}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Connect →
              </button>
            </div>
          )}

          {calendarConnected === true && (
            <div className="flex items-center justify-between rounded-[1.75rem] border border-green-200 bg-green-50 px-6 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <p className="text-sm font-medium text-green-800">Google Calendar connected</p>
              </div>
              <button
                onClick={disconnectCalendar}
                disabled={isDisconnecting}
                className="rounded-full border border-red-200 bg-white px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          )}

          {readyMeetings.length > 0 && (
            <div className="flex flex-col gap-3 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-emerald-950">Transcript ready</p>
                <p className="text-sm text-emerald-800">
                  {readyMeetings[0].title} is ready with transcript, summary, decisions, and action items.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/meetings/${readyMeetings[0]._id}`)}
                className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                View transcript
              </button>
            </div>
          )}

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

          {/* Left panel — tabs */}
          <section className="rounded-[2rem] bg-white p-8 shadow-xl">

            {/* Tab switcher */}
            <div className="mb-8 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                  activeTab === "schedule"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Schedule meeting
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mom")}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                  activeTab === "mom"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Generate MOM
              </button>
            </div>

            {/* ── Tab 1: Schedule ─────────────────────────────────────── */}
            {activeTab === "schedule" && (
              <>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Schedule a meeting</h2>
                    <p className="mt-2 text-slate-600">
                      Creates a Google Calendar event and sends Meet link to participants.
                    </p>
                  </div>
                </div>

                {/* Scheduled event result */}
                {scheduledEvent && (
                  <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-green-900">Meeting scheduled!</p>
                    <p className="mt-1 text-sm text-green-700">{scheduledEvent.title}</p>
                    <a
                      href={scheduledEvent.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-sm font-semibold text-green-800 underline"
                    >
                      {scheduledEvent.meetLink}
                    </a>
                    <p className="mt-3 text-sm text-green-700">
                      {scheduledEvent.participantCount} participant(s) invited.{" "}
                      <button
                        type="button"
                        className="font-semibold underline"
                        onClick={() => router.push(`/meetings/${scheduledEvent.meetingId}`)}
                      >
                        View automatic MOM status →
                      </button>
                    </p>
                  </div>
                )}

                {!calendarConnected ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-slate-600">Connect Google Calendar to schedule meetings.</p>
                    <button
                      onClick={connectCalendar}
                      className="mt-4 rounded-full bg-slate-950 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSchedule(onSchedule)}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-slate-900">
                        Meeting title
                        <input
                          {...regSchedule("title")}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                          placeholder="Sprint planning"
                        />
                        {scheduleErrors.title && (
                          <p className="text-sm text-rose-600">{scheduleErrors.title.message}</p>
                        )}
                      </label>

                      <label className="space-y-2 text-sm font-medium text-slate-900">
                        Duration
                        <select
                          {...regSchedule("durationMinutes")}
                          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                        >
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={90}>1.5 hours</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </label>
                    </div>

                    <label className="space-y-2 text-sm font-medium text-slate-900">
                      Date &amp; time
                      <input
                        type="datetime-local"
                        {...regSchedule("startTime")}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                      {scheduleErrors.startTime && (
                        <p className="text-sm text-rose-600">{scheduleErrors.startTime.message}</p>
                      )}
                    </label>

                    {/* Dynamic participants — Schedule */}
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">
                          Participants ({scheduleParticipants.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => appendScheduleParticipant({ name: "", email: "" })}
                          className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <span className="text-base leading-none">+</span> Add participant
                        </button>
                      </div>
                      {scheduleParticipants.map((field, index) => (
                        <div key={field.id} className="mb-3 flex items-start gap-2">
                          <div className="grid flex-1 gap-3 sm:grid-cols-2">
                            <input
                              {...regSchedule(`participants.${index}.name` as const)}
                              placeholder="Name"
                              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                            />
                            <input
                              {...regSchedule(`participants.${index}.email` as const)}
                              placeholder="email@example.com"
                              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                            />
                          </div>
                          {scheduleParticipants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeScheduleParticipant(index)}
                              className="mt-2.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                              aria-label="Remove participant"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      {scheduleErrors.participants && (
                        <p className="mt-2 text-sm text-rose-600">{scheduleErrors.participants.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isScheduling}>
                        {isScheduling ? "Scheduling…" : "Schedule & get Meet link"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* ── Tab 2: Generate MOM ─────────────────────────────────── */}
            {activeTab === "mom" && (
              <>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Generate MOM</h2>
                    <p className="mt-2 text-slate-600">
                      Upload your transcript and let AI create action items automatically.
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>

                {scheduledEvent && (
                  <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      Generating MOM for <span className="font-semibold">{scheduledEvent.title}</span>
                    </p>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleMom(onMomSubmit)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-slate-900">
                      Meeting title
                      <input
                        {...regMom("title")}
                        defaultValue={scheduledEvent?.title || ""}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                        placeholder="Sprint planning"
                      />
                      {momErrors.title && (
                        <p className="text-sm text-rose-600">{momErrors.title.message}</p>
                      )}
                    </label>
                    <label className="space-y-2 text-sm font-medium text-slate-900">
                      Date
                      <input
                        type="date"
                        {...regMom("date")}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      />
                    </label>
                  </div>

                  {/* Dynamic participants — MOM */}
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        Participants ({momParticipants.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => appendMomParticipant({ name: "", email: "" })}
                        className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <span className="text-base leading-none">+</span> Add participant
                      </button>
                    </div>
                    {momParticipants.map((field, index) => (
                      <div key={field.id} className="mb-3 flex items-start gap-2">
                        <div className="grid flex-1 gap-3 sm:grid-cols-2">
                          <input
                            {...regMom(`participants.${index}.name` as const)}
                            placeholder="Name"
                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                          <input
                            {...regMom(`participants.${index}.email` as const)}
                            placeholder="email@example.com"
                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                        {momParticipants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMomParticipant(index)}
                            className="mt-2.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                            aria-label="Remove participant"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {momErrors.participants && (
                      <p className="mt-2 text-sm text-rose-600">{momErrors.participants.message}</p>
                    )}
                  </div>

                  <label className="space-y-2 text-sm font-medium text-slate-900">
                    Transcript
                    <textarea
                      {...regMom("transcript")}
                      rows={8}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
                      placeholder="Paste meeting transcript here..."
                    />
                    {momErrors.transcript && (
                      <p className="text-sm text-rose-600">{momErrors.transcript.message}</p>
                    )}
                  </label>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">
                      Generates summary, decisions, and action items.
                    </p>
                    <Button type="submit" disabled={isMomSubmitting}>
                      {isMomSubmitting ? "Generating…" : "Generate MOM"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </section>

          {/* Right panel — recent meetings */}
          <section className="rounded-[2rem] bg-white p-8 shadow-xl">
            <div>
              <h2 className="text-2xl font-semibold">Recent meetings</h2>
              <p className="mt-2 text-slate-600">
                Quick access to your latest MOM summaries and email status.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-[1.5rem] bg-slate-100" />
                  <div className="h-24 rounded-[1.5rem] bg-slate-100" />
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-center text-slate-600">
                  No meetings yet. Schedule one or generate a MOM to get started.
                </div>
              ) : (
                recentMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="rounded-[1.75rem] border border-slate-200 p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{meeting.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {new Date(meeting.date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={meeting.emailStatus} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                      {meeting.participants?.map((p: any) => (
                        <span key={p.email} className="rounded-full bg-slate-100 px-3 py-1">
                          {p.name}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-5 text-sm font-semibold text-slate-950 hover:text-slate-700"
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
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-white p-8 shadow-xl">
            Loading dashboard…
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
