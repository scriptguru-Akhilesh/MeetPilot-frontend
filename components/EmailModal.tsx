interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  participants: { name: string; email: string }[];
  sending?: boolean;
}

export function EmailModal({
  open,
  onClose,
  onConfirm,
  participants,
  sending = false,
}: EmailModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Send MOM to participants
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Confirm that the meeting minutes and action list should be emailed
              now.
            </p>
          </div>
          <button
            className="rounded-full bg-slate-100 px-3 py-2 text-slate-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.email}
              className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <p className="font-medium text-slate-900">{participant.name}</p>
              <p className="text-sm text-slate-600">{participant.email}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send MOM"}
          </button>
        </div>
      </div>
    </div>
  );
}
