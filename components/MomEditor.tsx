interface MomEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MomEditor({
  label,
  value,
  onChange,
  placeholder,
}: MomEditorProps) {
  return (
    <label className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={8}
        className="mt-3 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--secondary)]"
      />
    </label>
  );
}
