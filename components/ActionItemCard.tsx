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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{task}</h3>
          <p className="mt-2 text-sm text-slate-600">
            Assigned to{" "}
            <span className="font-medium text-slate-900">{assignee}</span>
            {dueDate ? ` • Due ${new Date(dueDate).toLocaleDateString()}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {onStatusChange ? (
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
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
