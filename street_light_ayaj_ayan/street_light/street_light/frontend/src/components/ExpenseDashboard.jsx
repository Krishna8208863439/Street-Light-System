import MetricCard from './MetricCard'

// Format helpers
function fmt(val, decimals = 4) {
  return Number(val ?? 0).toFixed(decimals)
}
function fmtINR(val, decimals = 2) {
  return `₹${Number(val ?? 0).toFixed(decimals)}`
}

/**
 * ExpenseDashboard — Municipal cost analytics panel.
 * Slate-neutral government website presentation.
 */
export default function ExpenseDashboard({ metrics }) {
  if (!metrics) return null

  const {
    smart_cost_inr,
    traditional_cost_inr,
    cost_saved_inr,
    projected_monthly_savings_inr,
    projected_annual_savings_inr,
    smart_kwh_total,
    traditional_kwh_total,
    energy_saved_pct,
  } = metrics

  return (
    <div className="glass-card p-6" id="expense-dashboard">
      
      {/* Header */}
      <div className="mb-6">
        <p className="section-header mb-1 text-slate-400 font-sans">Financial Impact</p>
        <h2 className="text-sm font-bold text-slate-100">Municipal Expense Audit</h2>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Smart Grid Expense"
          value={fmtINR(smart_cost_inr, 5)}
          unit="INR"
          sublabel="Traditional Grid"
          subvalue={fmtINR(traditional_cost_inr, 5)}
          accent="neutral"
          icon="💳"
        />
        <MetricCard
          label="Total Cost Saved"
          value={fmtINR(cost_saved_inr, 5)}
          unit="INR"
          sublabel="Savings Ratio"
          subvalue={`${fmt(energy_saved_pct, 2)}%`}
          accent="green"
          icon="💰"
        />
        <MetricCard
          label="Projected Annual Savings"
          value={fmtINR(projected_annual_savings_inr)}
          unit="INR"
          sublabel="Monthly Projection"
          subvalue={fmtINR(projected_monthly_savings_inr)}
          accent="amber"
          icon="📈"
        />
      </div>

      {/* Split comparison table using official gov-table style */}
      <div className="rounded border border-slate-800 overflow-hidden bg-slate-900/10">
        <table className="gov-table">
          <thead>
            <tr>
              <th className="text-left">Operational Metric</th>
              <th className="text-right">Traditional Grid</th>
              <th className="text-right">Intelligent Grid</th>
              <th className="text-right">Net Saved</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-slate-400 font-medium">Power Consumed (kWh)</td>
              <td className="text-right font-mono text-slate-400">{fmt(traditional_kwh_total, 6)}</td>
              <td className="text-right font-mono text-slate-200 font-medium">{fmt(smart_kwh_total, 6)}</td>
              <td className="text-right font-mono text-emerald-400 font-semibold">{fmt(traditional_kwh_total - smart_kwh_total, 6)}</td>
            </tr>
            <tr>
              <td className="text-slate-400 font-medium">Electricity Cost (INR)</td>
              <td className="text-right font-mono text-slate-400">{fmtINR(traditional_cost_inr, 6)}</td>
              <td className="text-right font-mono text-slate-200 font-medium">{fmtINR(smart_cost_inr, 6)}</td>
              <td className="text-right font-mono text-emerald-400 font-semibold">{fmtINR(cost_saved_inr, 6)}</td>
            </tr>
            <tr>
              <td className="text-slate-400 font-medium">Projected Monthly Cost</td>
              <td className="text-right font-mono text-slate-400">
                {fmtINR((traditional_cost_inr / Math.max(metrics.simulation_seconds, 1)) * 12 * 30 * 3600)}
              </td>
              <td className="text-right font-mono text-slate-200 font-medium">
                {fmtINR(((traditional_cost_inr / Math.max(metrics.simulation_seconds, 1)) * 12 * 30 * 3600) - projected_monthly_savings_inr)}
              </td>
              <td className="text-right font-mono text-emerald-400 font-semibold">{fmtINR(projected_monthly_savings_inr)}</td>
            </tr>
            <tr>
              <td className="text-slate-400 font-medium">Projected Annual Cost</td>
              <td className="text-right font-mono text-slate-400">
                {fmtINR((traditional_cost_inr / Math.max(metrics.simulation_seconds, 1)) * 12 * 365 * 3600)}
              </td>
              <td className="text-right font-mono text-slate-200 font-medium">
                {fmtINR(((traditional_cost_inr / Math.max(metrics.simulation_seconds, 1)) * 12 * 365 * 3600) - projected_annual_savings_inr)}
              </td>
              <td className="text-right font-mono text-emerald-400 font-semibold">{fmtINR(projected_annual_savings_inr)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <p className="mt-4 text-[10px] text-slate-500 italic font-mono leading-relaxed">
        Assumptions: Rate = ₹10.00/kWh · Rated Wattage = 150W/pole · Night Cycle = 12 hours · Nodes = 5 · CO₂ Offset = 0.4kg/kWh
      </p>
    </div>
  )
}
