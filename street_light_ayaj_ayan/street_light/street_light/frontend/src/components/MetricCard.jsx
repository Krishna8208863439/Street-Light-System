/**
 * MetricCard — a reusable zinc-styled card for displaying a single KPI metric.
 */
export default function MetricCard({
  label,
  value,
  unit,
  sublabel,
  subvalue,
  accent = 'neutral',
  large = false,
  icon,
}) {
  const accentColors = {
    neutral: { text: 'text-slate-100', border: 'border-slate-800/80', bg: 'bg-slate-900/40', label: 'text-slate-400' },
    amber:   { text: 'text-amber-400', border: 'border-amber-900/30', bg: 'bg-amber-950/20', label: 'text-slate-400' },
    green:   { text: 'text-emerald-400', border: 'border-emerald-900/30', bg: 'bg-emerald-950/20', label: 'text-slate-400' },
    indigo:  { text: 'text-indigo-400', border: 'border-indigo-900/30', bg: 'bg-indigo-950/20', label: 'text-slate-400' },
  }
  const ac = accentColors[accent] ?? accentColors.neutral

  return (
    <div className={`glass-card p-5 flex flex-col gap-2 border ${ac.border} ${ac.bg}`}>
      <div className="flex items-center justify-between">
        <p className="section-header !text-zinc-500">{label}</p>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`metric-value ${large ? 'text-4xl' : 'text-2xl'} font-bold tracking-tight ${ac.text}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-zinc-500 font-medium">{unit}</span>}
      </div>
      {sublabel && subvalue !== undefined && (
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-800/50">
          <span className="text-[11px] text-zinc-500">{sublabel}</span>
          <span className="text-[11px] font-semibold text-zinc-400">{subvalue}</span>
        </div>
      )}
    </div>
  )
}
