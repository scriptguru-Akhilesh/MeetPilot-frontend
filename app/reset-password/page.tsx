import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-md flex-col gap-8 rounded-[2rem] bg-white p-10 shadow-xl">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
            Reset password
          </p>
          <h1 className="text-3xl font-semibold">Choose a new password</h1>
          <p className="text-slate-600">
            Enter your new password to restore account access.
          </p>
        </div>

        <Suspense
          fallback={
            <p className="text-sm text-slate-500">Loading reset form…</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
