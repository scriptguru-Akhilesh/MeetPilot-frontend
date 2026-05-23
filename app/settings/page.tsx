"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { Button } from "@/components/Button";
import { useToast } from "@/components/useToast";

const profileSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    authFetch<{ name: string; email: string }>("/api/auth/profile")
      .then((profile) => {
        setValue("name", profile.name);
        setValue("email", profile.email);
      })
      .catch((err) => {
        showToast((err as Error).message, "error");
      })
      .finally(() => setLoading(false));
  }, [router, setValue]);

  async function onSubmit(values: ProfileForm) {
    try {
      const updated = await authFetch<{ name: string; email: string }>(
        "/api/auth/profile",
        {
          method: "PATCH",
          body: JSON.stringify(values),
        },
      );
      showToast("Profile updated successfully.", "success");
      setValue("name", updated.name);
      setValue("email", updated.email);
    } catch (err) {
      showToast((err as Error).message, "error");
    }
  }

  const handleSignOut = () => {
    clearToken();
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-10 shadow-xl">
          Loading profile…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 shadow-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Account settings</h1>
          <p className="mt-2 text-slate-600">
            Update your profile details and password.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-2 text-sm font-medium text-slate-900">
            Name
            <input
              {...register("name")}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
            {errors.name && (
              <p className="text-sm text-rose-600">{errors.name.message}</p>
            )}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-900">
            Email
            <input
              {...register("email")}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
            />
            {errors.email && (
              <p className="text-sm text-rose-600">{errors.email.message}</p>
            )}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-900">
            New password (optional)
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400"
              placeholder="Leave blank to keep current password"
            />
            {errors.password && (
              <p className="text-sm text-rose-600">{errors.password.message}</p>
            )}
          </label>

          <p className="text-sm text-slate-500">
            Your profile changes will be saved and applied immediately.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={isSubmitting}>
              Save changes
            </Button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
