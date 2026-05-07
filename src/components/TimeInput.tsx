interface Props {
  label: string;
  seconds: number;
  onChange: (seconds: number) => void;
  className?: string;
}

export function TimeInput({ label, seconds, onChange, className = '' }: Props) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const handleMins = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    onChange(val * 60 + secs);
  };

  const handleSecs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
    onChange(mins * 60 + val);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={99}
          value={mins}
          onChange={handleMins}
          className="w-14 border border-slate-300 rounded px-2 py-1.5 text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-slate-500 font-bold">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={String(secs).padStart(2, '0')}
          onChange={handleSecs}
          className="w-14 border border-slate-300 rounded px-2 py-1.5 text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400 ml-1">MM:SS</span>
      </div>
    </div>
  );
}
