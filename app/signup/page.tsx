"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { setToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/Button";
import { useToast } from "@/components/useToast";
import { ButtonSpinner } from "@/components/Spinner";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupForm) {
    try {
      const response = await apiFetch<{ token: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(values),
      });

      if (response?.token) {
        setToken(response.token);
        showToast("Welcome aboard! Your account is ready.", "success");
        router.push("/dashboard");
      } else {
        throw new Error("Invalid response received from server.");
      }
    } catch (err) {
      showToast((err as Error).message || "An unexpected error occurred", "error");
    }
  }

  return (
    <main className="h-screen w-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden select-none">

      {/* GLOBAL BACKGROUND AMBIENT GLOWS */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-full bg-[var(--primary)]/10 blur-[100px] sm:blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-full bg-[var(--secondary)]/10 blur-[100px] sm:blur-[130px] pointer-events-none" />

      {/* COMPONENT CONTAINER: Full screen on mobile, pinned max container on desktop */}
      <div className="w-full h-full sm:h-auto sm:max-h-[1140px] max-w-[1300px] grid grid-cols-12 rounded-none sm:rounded-[32px] border-0 sm:border border-[var(--border)]/60 bg-transparent sm:bg-[var(--card)]/20 sm:backdrop-blur-md overflow-hidden shadow-none sm:shadow-2xl relative z-10">

        {/* LEFT COMPONENT: RESPONSIVE AUTH INTERFACE */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 bg-[var(--background)]/40 backdrop-blur-xl h-full overflow-y-auto no-scrollbar">

          {/* BRAND MARK */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => router.push('/')}>
            <Image
              src="/images/logo.png"
              alt="logo"
              width={48}
              height={48}
              className="object-contain w-8 h-8 sm:w-10 sm:h-10"
              priority
            />
            <span className="font-extrabold tracking-tight text-lg sm:text-xl bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground)]/80">MeetPilot</span>
          </div>

          {/* MAIN FORM */}
          <div className="w-full max-w-sm mx-auto my-auto space-y-6 sm:space-y-8 py-6">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight xl:text-5xl">
                Get started
              </h1>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Create an account to automatically generate minutes of meetings and clean team workflows.
              </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit(onSubmit)}>

              {/* NAME FIELD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  Full Name
                </label>
                <input
                  {...register("name")}
                  placeholder="Jane Doe"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/40 px-4 sm:px-5 py-3 sm:py-3.5 text-base outline-none transition-all duration-200 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5"
                />
                {errors.name && (
                  <p className="text-xs font-medium text-red-500 pl-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

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

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  Password
                </label>

                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--card)]/40 px-4 sm:px-5 py-3 sm:py-3.5 pr-12 text-base outline-none transition-all duration-200 focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10"
                />

                {/* ICON BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-9 text-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  {showPassword ? (
                    <EyeOff size={18}  className="cursor-pointer" />
                  ) : (
                    <Eye size={18}  className="cursor-pointer"/>
                  )}
                </button>

                {errors.password && (
                  <p className="text-xs font-medium text-red-500 pl-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* SUBMIT */}
              <Button
                type="submit"
                className="w-full h-12 sm:h-13 mt-2 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner className="h-5 w-5 text-[var(--background)]" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <p className="text-sm text-center text-[var(--muted)]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--foreground)] font-semibold hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* FOOTER EXTRA */}
          <div className="text-xs text-[var(--muted)] shrink-0 pt-4 sm:pt-0">
            &copy; {new Date().getFullYear()} MeetPilot Inc.
          </div>
        </div>

        {/* RIGHT COMPONENT: HIDDEN ON MOBILE / ACTIVE ON DESKTOP */}
        <div className="hidden lg:flex lg:col-span-6 relative items-center justify-center p-12 overflow-hidden border-l border-[var(--border)]/40 bg-[var(--card)]/10 h-full">

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes expand-pulse {
              0% { transform: scale(1) rotate(0deg); opacity: 0.15; }
              50% { transform: scale(1.2) rotate(180deg); opacity: 0.25; }
              100% { transform: scale(1) rotate(360deg); opacity: 0.15; }
            }
            @keyframes target-drift {
              0% { transform: translate(0px, 0px) scale(0.95); }
              50% { transform: translate(-30px, 40px) scale(1.05); }
              100% { transform: translate(0px, 0px) scale(0.95); }
            }
            .animate-signup-1 { animation: expand-pulse 20s infinite linear; }
            .animate-signup-2 { animation: target-drift 12s infinite ease-in-out; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          <div className="absolute h-[550px] w-[550px] rounded-full border border-[var(--primary)]/10 animate-signup-1 pointer-events-none" />
          <div className="absolute h-[380px] w-[380px] rounded-full border-dashed border-[var(--secondary)]/20 animate-signup-1 [animation-direction:reverse] pointer-events-none" />

          <div className="absolute top-1/3 right-1/4 h-[350px] w-[350px] rounded-full bg-[var(--secondary)]/15 blur-[100px] pointer-events-none animate-signup-2 mix-blend-screen" />
          <div className="absolute bottom-1/3 left-1/4 h-[350px] w-[350px] rounded-full bg-[var(--primary)]/15 blur-[100px] pointer-events-none animate-signup-2 [animation-delay:-4s] mix-blend-screen" />

          <div className="relative max-w-sm text-center space-y-5 z-10">
            <div className="inline-flex px-3 py-1 rounded-full bg-[var(--card)]/60 border border-[var(--border)]/80 text-xs text-[var(--muted)] font-medium tracking-wide shadow-sm backdrop-blur-md">
              Deploy Smarter Workspaces
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-[var(--foreground)] to-[var(--foreground)]/80 bg-clip-text text-transparent">
              Turn your meetings into action pipelines.
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Connect transcription engines, sync live trackers, and distribute summary objectives instantly to your team dashboard.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}