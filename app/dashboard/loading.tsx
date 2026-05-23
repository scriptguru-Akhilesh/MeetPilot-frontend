function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--muted-bg)] ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6">
        <section className="rounded-lg bg-[var(--card)] p-6 shadow-sm">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="mt-4 h-8 w-64 max-w-full" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-lg bg-[var(--card)] p-6 shadow-sm">
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="mt-8 h-7 w-48" />
            <SkeletonBlock className="mt-4 h-12 w-full" />
            <SkeletonBlock className="mt-4 h-12 w-full" />
            <SkeletonBlock className="mt-4 h-32 w-full" />
          </section>

          <section className="rounded-lg bg-[var(--card)] p-6 shadow-sm">
            <SkeletonBlock className="h-7 w-44" />
            <SkeletonBlock className="mt-4 h-4 w-full" />
            <SkeletonBlock className="mt-8 h-24 w-full" />
            <SkeletonBlock className="mt-4 h-24 w-full" />
          </section>
        </div>
      </div>
    </div>
  );
}
