type ProgressBarProps = {
  value: number;
  max: number;
  label: string;
};

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const ratio = Math.min(value / safeMax, 1);
  const percent = Math.round(ratio * 100);

  return (
    <div className="space-y-2" aria-label={label}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-ink">
          {value}/{max} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-line">
        <div
          className="animate-bar-fill h-full rounded-sm bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
