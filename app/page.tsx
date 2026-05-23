"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Moon,
  Sparkles,
  Sun,
  Activity,
  BarChart3,
  Clock3,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import SplashScreen from "@/components/SplashScreen";
import { motion } from "framer-motion";

const features = [
  {
    title: "AI MOM Generation",
    desc: "Generate polished MOMs and summaries automatically after every meeting.",
  },
  {
    title: "Auto Email Workflow",
    desc: "AI automatically sends MOM emails to employees and stakeholders.",
  },
  {
    title: "Employee Task Tracking",
    desc: "Track assigned work, completion progress, and pending tasks in real-time.",
  },
];

const history = [
  {
    title: "Sprint Planning Meeting",
    status: "Email delivered to 12 members",
  },
  {
    title: "Client Discussion",
    status: "Pending tasks assigned",
  },
  {
    title: "Marketing Weekly Sync",
    status: "Meeting summary generated",
  },
];

export default function HomePage() {
  const [dark, setDark] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  if (loading) {
    return <SplashScreen onDone={() => setLoading(false)} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* GLOW */}
      <div className="absolute left-[-200px] top-[-200px] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="absolute bottom-[-250px] right-[-200px] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

      <section className="container-main px-4 sm:px-6 lg:px-8 py-6 relative z-10 max-w-7xl mx-auto">
        {/* NAVBAR */}
        <nav className="glass-card sticky top-6 z-50 flex items-center justify-between rounded-[24px] sm:rounded-[28px] px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white shadow-lg border border-gray-200 dark:border-gray-300 flex-shrink-0">
              <Image
                src="/images/logo.png"
                alt="logo"
                width={48}
                height={48}
                className="object-contain w-8 h-8 sm:w-12 sm:h-12"
              />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-[var(--foreground)] leading-none">
                MeetPilot
              </h2>
              <p className="text-[10px] sm:text-xs text-[var(--muted)] mt-1">
                AI Meeting Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setDark(!dark)}
              className="glass-card rounded-xl sm:rounded-2xl p-2 sm:p-3 transition-all duration-300 hover:scale-105 text-[var(--foreground)] cursor-pointer"
            >
              {dark ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>

            <Link href="/login" className="btn-secondary text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2.5">
              Login
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="grid items-center gap-12 lg:gap-20 py-12 md:py-20 lg:py-24 grid-cols-1 lg:grid-cols-2">
          {/* LEFT */}
          <div className="relative order-2 lg:order-1 mt-12 lg:mt-0">
            {/* FLOATING CARD - HIDDEN ON SMALL MOBILE, SHIFTED FOR SAFE POSITIONING */}
            <div className="hidden sm:block absolute -top-12 left-4 md:left-50 animate-[float_5s_ease-in-out_infinite] rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-2xl backdrop-blur-xl z-20">
              <p className="text-[10px] text-[var(--muted)]">
                AI Generated MOM
              </p>
              <div className="mt-1 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Summary Completed
                </p>
              </div>
            </div>

            {/* FLOATING CARD - HIDDEN ON SMALL MOBILE, SHIFTED FOR SAFE POSITIONING */}
            <div className="hidden 2xl:block absolute -right-4 lg:-right-12 top-16 animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-2xl backdrop-blur-xl z-20">
              <p className="text-[10px] text-[var(--muted)]">
                Auto Email Delivery
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-indigo-500" />
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Sent to Employees
                </p>
              </div>
            </div>

            {/* BADGE */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs sm:text-sm font-medium shadow-sm text-[var(--foreground)]">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              AI Powered Workflow
            </div>

            {/* HEADING */}
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black leading-[1.1] tracking-tight text-[var(--foreground)]">
              Manage Meetings
              <br />
              <span className="bg-gradient-to-b from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
                Without Manual Work
              </span>
            </h1>

            {/* DESCRIPTION */}
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-[var(--muted)]">
              Generate AI-powered MOMs, assign tasks automatically,
              track employee work progress, and send beautiful
              meeting emails instantly.
            </p>

            {/* BUTTONS */}
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
              <Link
                href="/signup"
                className="btn-primary flex items-center justify-center gap-2 py-3 px-6 text-center"
              >
                Start Free
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard"
                className="btn-secondary text-center py-3 px-6"
              >
                Explore Dashboard
              </Link>
            </div>

            {/* STATS */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.title}
                  className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1"
                >
                  <p className="text-xs sm:text-sm text-[var(--muted)] truncate">
                    {item.title.split(" ")[0]}
                  </p>
                  <h3 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                    {item.status.match(/\d+K?|\d+\.\d+\w?/)?.[0] || "12K+"}
                  </h3>
                </div>
              ))}
            </div>

            {/* FEATURES */}
            <div className="mt-12 space-y-4 sm:space-y-5">
              {features.map((item, index) => (
                <div
                  key={item.title}
                  className="group glass-card flex items-start gap-4 rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  style={{
                    animationDelay: `${index * 150}ms`,
                  }}
                >
                  <div className="mt-0.5 rounded-xl sm:rounded-2xl bg-[var(--muted-bg)] p-2.5 sm:p-3 text-[var(--foreground)] flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm leading-6 sm:leading-7 text-[var(--muted)]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative order-1 lg:order-2 w-full max-w-2xl mx-auto lg:max-w-none">
            <div className="glass-card relative overflow-hidden rounded-[24px] sm:rounded-[40px] p-4 sm:p-6">
              {/* TOP SHINE */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-5">
                <div>
                  <p className="text-xs sm:text-sm text-[var(--muted)]">
                    Active Workspace
                  </p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                    Weekly Product Sync
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto rounded-full bg-green-500/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-green-500">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                  Live
                </div>
              </div>

              {/* MAIN CARD */}
              <div className="mt-6 rounded-[20px] sm:rounded-[30px] border border-[var(--border)] bg-[var(--muted-bg)] p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-[var(--muted)]">
                      AI Processing
                    </p>
                    <h4 className="mt-1 text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                      Generating MOM Email
                    </h4>
                  </div>

                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--foreground)] text-[var(--background)] shadow-lg flex-shrink-0">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>

                {/* BARS */}
                <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
                  {[90, 70, 55].map((width, i) => (
                    <div
                      key={i}
                      className="h-2.5 sm:h-3 overflow-hidden rounded-full bg-[var(--border)]"
                    >
                      <div
                        className="h-full bg-[var(--foreground)] opacity-30 animate-pulse rounded-full"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* INFO CARDS */}
                <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="rounded-xl sm:rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-indigo-500/10 p-2 flex-shrink-0">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                      </div>

                      <div>
                        <p className="text-xs text-[var(--muted)]">
                          Task Progress
                        </p>
                        <h5 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
                          84% Completed
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-green-500/10 p-2 flex-shrink-0">
                        <Clock3 className="h-5 w-5 text-green-500" />
                      </div>

                      <div>
                        <p className="text-xs text-[var(--muted)]">
                          Delivery Time
                        </p>
                        <h5 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">
                          2 mins ago
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HISTORY */}
              <div className="mt-6 sm:mt-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                    Recent History
                  </h4>
                  <p className="text-xs sm:text-sm text-[var(--muted)]">
                    Today
                  </p>
                </div>

                <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
                  {history.map((item) => (
                    <div
                      key={item.title}
                      className="glass-card flex items-center justify-between gap-4 rounded-xl sm:rounded-2xl p-4 transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="min-w-0">
                        <h5 className="text-sm sm:text-base font-medium text-[var(--foreground)] truncate">
                          {item.title}
                        </h5>
                        <p className="mt-0.5 text-xs sm:text-sm text-[var(--muted)] truncate">
                          {item.status}
                        </p>
                      </div>

                      <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* FLOAT ANIMATION */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </main>
  );
}