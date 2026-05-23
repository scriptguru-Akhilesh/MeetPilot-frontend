import { StatusBadge } from "./StatusBadge";

interface ActionItemCardProps {
  task: string;
  assignee: string;
  dueDate?: string;
  status: string;
  onStatusChange?: (status: string) => void;
}

export function ActionItemCard({
  task,
  assignee,
  dueDate,
  status,
  onStatusChange,
}: ActionItemCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow)] transition hover:border-[var(--secondary)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">{task}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Assigned to{" "}
            <span className="font-medium text-[var(--foreground)]">{assignee}</span>
            {dueDate ? ` • Due ${new Date(dueDate).toLocaleDateString()}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {onStatusChange ? (
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--secondary)]"
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
}
