import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import MetricCard from './MetricCard'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded border p-3 text-xs"
      style={{
        background: 'rgba(15,23,42,0.95)',
        borderColor: 'rgba(226,232,240,0.08)',
      }}
    >
      <p className="text-slate-400 mb-1.5 font-mono">{label}s elapsed</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {Number(p.value).toFixed(2)} W
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * EnergyTracker — Real-time energy analytics panel.
 * Designed with Slate-neutral lines and clean status highlights.
 */
export default function EnergyTracker({ metrics, chartData }) {
  if (!metrics) return null

  const {
    smart_kwh_total,
    traditional_kwh_total,
    kwh_saved,
    energy_saved_pct,
    smart_co2_kg,
    traditional_co2_kg,
    co2_saved_kg,
  } = metrics

  const savedColor = energy_saved_pct >= 50 ? '#f1f5f9' : '#94a3b8'
  const savedGlow = '0 0 25px rgba(226, 232, 240, 0.05)'

  return (
    <div className="glass-card p-6" id="energy-tracker">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="section-header mb-1 text-slate-400">Resource Optimization</p>
          <h2 className="text-sm font-bold text-slate-100">Power draw & Carbon Telemetry</h2>
        </div>
        {/* Savings percentage display */}
        <div className="text-left sm:text-right">
          <p className="section-header mb-1 text-slate-400">Optimization Savings</p>
          <div
            className="text-3xl sm:text-4xl font-extrabold metric-value transition-all duration-700"
            style={{ color: savedColor, textShadow: savedGlow }}
          >
            {Number(energy_saved_pct).toFixed(1)}
            <span className="text-xl ml-1 font-normal opacity-50">%</span>
          </div>
        </div>
      </div>

      {/* Grid metrics summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Smart Grid Accumulation"
          value={Number(smart_kwh_total).toFixed(5)}
          unit="kWh"
          accent="neutral"
          icon="⚡"
        />
        <MetricCard
          label="Traditional Baseline"
          value={Number(traditional_kwh_total).toFixed(5)}
          unit="kWh"
          accent="neutral"
          icon="🏭"
        />
        <MetricCard
          label="Aggregated Saved Power"
          value={Number(kwh_saved).toFixed(5)}
          unit="kWh"
          accent="green"
          icon="♻️"
        />
        <MetricCard
          label="CO₂ Carbon Offset"
          value={Number(co2_saved_kg).toFixed(5)}
          unit="kg"
          sublabel="Grid Factor"
          subvalue="0.4 kg/kWh"
          accent="neutral"
          icon="🌱"
        />
      </div>

      {/* Dual line graph */}
      <div className="rounded border border-slate-800 p-4 bg-slate-900/10">
        <p className="section-header mb-4 text-slate-400">Live Power Consumption Comparison (Watts)</p>
        {chartData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-slate-500 text-xs italic font-mono">
            Awaiting Night Mode simulation telemetry…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.02)" />
              <XAxis
                dataKey="t"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(226,232,240,0.05)' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(226,232,240,0.05)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }}
              />
              {/* Dotted traditional baseline */}
              <Line
                type="monotone"
                dataKey="traditional"
                name="Traditional Grid (150W × 5)"
                stroke="#475569"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                isAnimationActive={false}
              />
              {/* Solid neutral-white smart grid line */}
              <Line
                type="monotone"
                dataKey="smart"
                name="Smart Grid (Dynamic)"
                stroke="#cbd5e1"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
