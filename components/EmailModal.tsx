interface EmailModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (recipientEmails: string[]) => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Send MOM to participants
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Select who should receive the meeting minutes and action list.
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-[var(--muted-bg)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:text-[var(--secondary)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form
          id="email-recipients-form"
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            onConfirm(formData.getAll("recipients").map(String));
          }}
        >
          {participants.map((participant) => (
            <label
              key={participant.email}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3"
            >
              <input
                type="checkbox"
                name="recipients"
                value={participant.email}
                defaultChecked
                className="h-4 w-4 accent-[var(--secondary)]"
              />
              <span>
                <span className="block font-medium text-[var(--foreground)]">{participant.name}</span>
                <span className="block text-sm text-[var(--muted)]">{participant.email}</span>
              </span>
            </label>
          ))}
        </form>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] cursor-pointer px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--secondary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="email-recipients-form"
            disabled={sending}
            className="rounded-lg primary-gradient px-5 py-3 text-sm font-semibold cursor-pointer text-[var(--background)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send Mail"}
          </button>
        </div>
      </div>
    </div>
  );
}
