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
  }, [router, setValue, showToast]);

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
      <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1300px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-[900px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--secondary)]">
            Settings
          </p>
          <h1 className="text-3xl font-semibold">Account settings</h1>
          <p className="mt-2 text-[var(--muted)]">
            Update your profile details and password.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
            Name
            <input
              {...register("name")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            {errors.name && (
              <p className="text-sm text-rose-600">{errors.name.message}</p>
            )}
          </label>
          <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
            Email
            <input
              {...register("email")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
            />
            {errors.email && (
              <p className="text-sm text-rose-600">{errors.email.message}</p>
            )}
          </label>
          <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
            New password (optional)
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--secondary)]"
              placeholder="Leave blank to keep current password"
            />
            {errors.password && (
              <p className="text-sm text-rose-600">{errors.password.message}</p>
            )}
          </label>

          <p className="text-sm text-[var(--muted)]">
            Your profile changes will be saved and applied immediately.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={isSubmitting}>
              Save changes
            </Button>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-rose-200 hover:text-rose-600"
            >
              Sign out
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
