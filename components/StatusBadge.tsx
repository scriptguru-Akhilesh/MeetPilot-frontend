interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  done: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] ?? "bg-slate-100 text-slate-800"}`}
    >
      {label}
    </span>
  );
}
