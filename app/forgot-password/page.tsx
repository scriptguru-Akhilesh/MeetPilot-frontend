"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/Button";
import { useToast } from "@/components/useToast";
import { ButtonSpinner } from "@/components/Spinner";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema)
  });

  async function onSubmit(values: ForgotForm) {
    try {
      await apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      showToast("If that email exists, reset instructions have been sent.", "success");
    } catch (err) {
      showToast((err as Error).message || "An unexpected error occurred", "error");
    }
  }

  return (
    <main className="h-screen w-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden select-none">

      {/* GLOBAL BACKGROUND AMBIENT GLOWS */}
      <div className="absolute top-1/4 left-1/3 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-[var(--primary)]/10 blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] rounded-full bg-[var(--secondary)]/10 blur-[100px] sm:blur-[140px] pointer-events-none" />

      {/* FIXED MAX CONTAINER (Centered Form Layout without Side Panel) */}
      <div className="w-full h-full sm:h-auto sm:max-h-[720px] max-w-[540px] flex flex-col justify-between p-6 sm:p-10 rounded-none sm:rounded-[32px] border-0 sm:border border-[var(--border)]/60 bg-transparent sm:bg-[var(--card)]/20 sm:backdrop-blur-md overflow-y-auto no-scrollbar shadow-none sm:shadow-2xl relative z-10">

        {/* BRAND MARK (Links to Landing Page) */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 self-start hover:opacity-90 transition-opacity cursor-pointer group"
        >
          <Image
            src="/images/logo.png"
            alt="logo"
            width={48}
            height={48}
            className="object-contain w-8 h-8 sm:w-10 sm:h-10"
            priority
          />
          <span className="font-extrabold tracking-tight text-lg sm:text-xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground)]/80">
            MeetPilot
          </span>
        </Link>

        {/* MAIN FORM AREA */}
        <div className="w-full max-w-sm mx-auto my-auto space-y-6 sm:space-y-8 py-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Reset password
            </h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Enter the email address associated with your account to recover your workspace access.
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)}>

            {/* EMAIL FIELD */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                Email Address
              </label>
              <input
                {...register("email")}
                placeholder="name@company.com"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/40 px-4 sm:px-5 py-3 sm:py-3.5 text-base outline-none transition-all duration-200 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5"
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-500 pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <p className="text-xs text-[var(--muted)]/80 leading-relaxed pl-0.5">
              We will notify you with recovery link steps if your email identifier matches a verified system profile.
            </p>

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full h-12 sm:h-13 mt-2 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ButtonSpinner className="h-5 w-5 text-[var(--background)]" />
                  <span>Sending recovery link...</span>
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          {/* BACK TO LOGIN ROUTE */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] font-semibold transition-colors hover:underline underline-offset-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-xs text-[var(--muted)] shrink-0 text-center sm:text-left pt-4 sm:pt-0">
          &copy; {new Date().getFullYear()} MeetPilot Inc.
        </div>
      </div>

      {/* Global CSS Inject for scroll bars */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}