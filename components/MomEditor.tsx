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
    <label className="block rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={8}
        className="mt-3 w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none focus:border-slate-400"
      />
    </label>
  );
}
