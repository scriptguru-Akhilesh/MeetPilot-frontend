"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/Button";
import { useToast } from "@/components/useToast";

const resetSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: ResetForm) {
    try {
      await apiFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password: values.password }),
      });
      showToast("Password reset successful. Redirecting to login...", "success");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  return token ? (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <label className="space-y-2 text-sm font-medium text-slate-900">
        New password
        <input
          type="password"
          {...register("password")}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
          placeholder="New password"
        />
        {errors.password && (
          <p className="text-sm text-rose-600">{errors.password.message}</p>
        )}
      </label>

      <p className="text-sm text-slate-500">
        Create a strong password to keep your account secure.
      </p>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Reset password"}
      </Button>
    </form>
  ) : (
    <p className="text-sm text-rose-600">
      Token is missing or invalid. Please request a new reset link.
    </p>
  );
}
