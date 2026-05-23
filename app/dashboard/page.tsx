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
import { CalendarDays, CheckCircle2, FileText, Sparkles } from "lucide-react";

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

interface MeetingParticipant {
  name: string;
  email: string;
}

interface DashboardMeeting {
  _id: string;
  title: string;
  date: string;
  emailStatus: string;
  momStatus?: string;
  rawTranscript?: string;
  participants?: MeetingParticipant[];
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

  const [meetings, setMeetings] = useState<DashboardMeeting[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const hasShownCalendarToast = useRef(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [dismissedReadyMeetingIds, setDismissedReadyMeetingIds] = useState<Set<string>>(
    () => {
      if (typeof window === "undefined") return new Set();

      const stored = localStorage.getItem("dismissedReadyMeetings");

      return stored ? new Set(JSON.parse(stored)) : new Set();
    },
  );

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
          authFetch<DashboardMeeting[]>("/api/meetings"),
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

    if (
      searchParams.get("calendar") === "connected" &&
      !hasShownCalendarToast.current
    ) {
      hasShownCalendarToast.current = true;

      showToast("Google meet connected successfully!", "success");

      router.replace("/dashboard");
    }

    const loadTimer = window.setTimeout(() => {
      loadDashboard(false);
    }, 0);

    return () => window.clearTimeout(loadTimer);
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
    setIsDisconnecting(true);
    try {
      await authFetch("/api/calendar/disconnect", { method: "DELETE" });
      setCalendarConnected(false);
      setShowDisconnectModal(false);
      showToast("Google meet disconnected.", "success");
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
        (meeting) =>
          meeting.momStatus === "generated" &&
          meeting.rawTranscript &&
          !dismissedReadyMeetingIds.has(meeting._id),
      ),
    [dismissedReadyMeetingIds, meetings],
  );

  const viewReadyTranscript = (meetingId: string) => {
    setDismissedReadyMeetingIds((current) => {
      const next = new Set(current);

      next.add(meetingId);

      localStorage.setItem(
        "dismissedReadyMeetings",
        JSON.stringify(Array.from(next)),
      );

      return next;
    });

    router.push(`/meetings/${meetingId}`);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto grid  gap-6">

        {/* Header stats */}
        <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-[var(--muted-bg)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">Dashboard</p>
                <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">Your meeting HQ</h1>
                <p className="max-w-2xl text-[var(--muted)]">
                  Schedule meetings, generate MOM, track actions, and send automated summary emails from one focused workspace.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm text-[var(--muted)]">
                <Sparkles size={18} className="text-[var(--secondary)]" />
                AI minutes enabled
              </div>
            </div>

            {/* Google Calendar connect/disconnect banner */}
            {calendarConnected === false && (
              <div className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[var(--foreground)]">Connect Google Calendar</p>
                  <p className="text-sm text-[var(--muted)]">
                    Schedule meetings and generate Meet links automatically.
                  </p>
                </div>
                <button
                  onClick={connectCalendar}
                  className="rounded-lg primary-gradient px-5 py-2 text-sm font-semibold text-[var(--background)] shadow-sm hover:opacity-95 cursor-pointer"
                >
                  Connect →
                </button>
              </div>
            )}

            {calendarConnected === true && (
              <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm font-medium text-green-800">Google meet connected</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={isDisconnecting}
                  className="rounded-lg cursor-pointer border border-red-200  px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {isDisconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            )}

            {readyMeetings.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-emerald-950">Transcript ready</p>
                  <p className="text-sm text-emerald-800">
                    {readyMeetings[0].title} is ready with transcript, summary, decisions, and action items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => viewReadyTranscript(readyMeetings[0]._id)}
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold cursor-pointer text-white hover:bg-emerald-800"
                >
                  View transcript
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--muted)]">Meetings</p>
                  <CalendarDays size={18} className="text-[var(--secondary)]" />
                </div>
                {loading ? (
                  <div className="mt-4 h-9 w-16 animate-pulse rounded-lg bg-[var(--border)]" />
                ) : (
                  <p className="mt-4 text-3xl font-semibold">{meetingCount}</p>
                )}
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--muted)]">Open actions</p>
                  <FileText size={18} className="text-[var(--secondary)]" />
                </div>
                {loading ? (
                  <div className="mt-4 h-9 w-16 animate-pulse rounded-lg bg-[var(--border)]" />
                ) : (
                  <p className="mt-4 text-3xl font-semibold">{stats.open}</p>
                )}
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--muted)]">Completed tasks</p>
                  <CheckCircle2 size={18} className="text-[var(--secondary)]" />
                </div>
                {loading ? (
                  <div className="mt-4 h-9 w-16 animate-pulse rounded-lg bg-[var(--border)]" />
                ) : (
                  <p className="mt-4 text-3xl font-semibold">{stats.done}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

          {/* Left panel — tabs */}
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">

            {/* Tab switcher */}
            <div className="mb-8 flex gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition cursor-pointer ${activeTab === "schedule"
                  ? "rounded-md bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] "
                  }`}
              >
                Schedule meeting
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mom")}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition cursor-pointer ${activeTab === "mom"
                  ? "rounded-md bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
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
                    <p className="mt-2 text-[var(--muted)]">
                      Creates a Google Calendar event and sends Meet link to participants.
                    </p>
                  </div>
                </div>

                {/* Scheduled event result */}
                {scheduledEvent && (
                  <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-5">
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
                  <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted-bg)] p-8 text-center">
                    <p className="text-[var(--muted)]">Connect Google Calendar to schedule meetings.</p>
                    <button
                      onClick={connectCalendar}
                      className="mt-4 rounded-lg primary-gradient px-6 py-2 text-sm font-semibold text-[var(--background)] shadow-sm hover:opacity-95"
                    >
                      Connect Google Calendar
                    </button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSchedule(onSchedule)}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                        Meeting title
                        <input
                          {...regSchedule("title")}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                          placeholder="Sprint planning"
                        />
                        {scheduleErrors.title && (
                          <p className="text-sm text-rose-600">{scheduleErrors.title.message}</p>
                        )}
                      </label>

                      <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                        Duration
                        <select
                          {...regSchedule("durationMinutes")}
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                        >
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={90}>1.5 hours</option>
                          <option value={120}>2 hours</option>
                        </select>
                      </label>
                    </div>

                    <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                      Date &amp; time
                      <input
                        type="datetime-local"
                        {...regSchedule("startTime")}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                      />
                      {scheduleErrors.startTime && (
                        <p className="text-sm text-rose-600">{scheduleErrors.startTime.message}</p>
                      )}
                    </label>

                    {/* Dynamic participants — Schedule */}
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] mt-4 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          Participants ({scheduleParticipants.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => appendScheduleParticipant({ name: "", email: "" })}
                          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] cursor-pointer transition hover:bg-[var(--muted-bg)]"
                        >
                          <span className="text-base leading-none cursor-pointer">+</span> Add participant
                        </button>
                      </div>
                      {scheduleParticipants.map((field, index) => (
                        <div key={field.id} className="mb-3 flex items-start gap-2">
                          <div className="grid flex-1 gap-3 sm:grid-cols-2">
                            <input
                              {...regSchedule(`participants.${index}.name` as const)}
                              placeholder="Name"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                            />
                            <input
                              {...regSchedule(`participants.${index}.email` as const)}
                              placeholder="email@example.com"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                            />
                          </div>
                          {scheduleParticipants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeScheduleParticipant(index)}
                              className="mt-2.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-rose-50 hover:text-rose-500 transition"
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

                    <div className="flex justify-end ">
                      <Button type="submit" disabled={isScheduling} >
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
                    <p className="mt-2 text-[var(--muted)]">
                      Upload your transcript and let AI create action items automatically.
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>

                {scheduledEvent && (
                  <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      Generating MOM for <span className="font-semibold">{scheduledEvent.title}</span>
                    </p>
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleMom(onMomSubmit)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                      Meeting title
                      <input
                        {...regMom("title")}
                        defaultValue={scheduledEvent?.title || ""}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                        placeholder="Sprint planning"
                      />
                      {momErrors.title && (
                        <p className="text-sm text-rose-600">{momErrors.title.message}</p>
                      )}
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                      Date
                      <input
                        type="date"
                        {...regMom("date")}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                      />
                    </label>
                  </div>

                  {/* Dynamic participants — MOM */}
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-4">
                    <div className="mb-4 flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        Participants ({momParticipants.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => appendMomParticipant({ name: "", email: "" })}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted-bg)]"
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
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                          />
                          <input
                            {...regMom(`participants.${index}.email` as const)}
                            placeholder="email@example.com"
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                          />
                        </div>
                        {momParticipants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMomParticipant(index)}
                            className="mt-2.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[var(--muted)] hover:bg-rose-50 hover:text-rose-500 transition"
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

                  <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
                    Transcript
                    <textarea
                      {...regMom("transcript")}
                      rows={8}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
                      placeholder="Paste meeting transcript here..."
                    />
                    {momErrors.transcript && (
                      <p className="text-sm text-rose-600">{momErrors.transcript.message}</p>
                    )}
                  </label>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--muted)]">
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
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
            <div>
              <h2 className="text-2xl font-semibold">Recent meetings</h2>
              <p className="mt-2 text-[var(--muted)]">
                Quick access to your latest MOM summaries and email status.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <div className="h-24 rounded-[1.5rem] bg-[var(--muted-bg)]" />
                  <div className="h-24 rounded-[1.5rem] bg-[var(--muted-bg)]" />
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted-bg)] p-8 text-center text-[var(--muted)]">
                  No meetings yet. Schedule one or generate a MOM to get started.
                </div>
              ) : (
                recentMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="rounded-lg border border-[var(--border)] p-5 shadow-sm transition hover:border-[var(--secondary)] hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-[var(--foreground)]">{meeting.title}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {new Date(meeting.date).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={meeting.emailStatus} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
                      {meeting.participants?.map((p) => (
                        <span key={p.email} className="rounded-lg bg-[var(--muted-bg)] px-3 py-1">
                          {p.name}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-5 text-sm cursor-pointer font-semibold text-[var(--foreground)] hover:text-[var(--secondary)]"
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

      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">
                Calendar
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                Disconnect Google Meet?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                You will not be able to schedule meetings or generate Meet links until you reconnect your calendar.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={isDisconnecting}
                className="rounded-lg border border-[var(--border)] cursor-pointer bg-[var(--muted-bg)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--secondary)] disabled:opacity-50 cursor-pointer"
              >
                Keep connected
              </button>
              <button
                type="button"
                onClick={disconnectCalendar}
                disabled={isDisconnecting}
                className="rounded-lg border border-[var(--border)] bg-[color:var(--danger,#ef4444)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1300px] rounded-lg bg-[var(--card)] p-6 shadow-sm">
            Loading dashboard…
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
