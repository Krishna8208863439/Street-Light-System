import { useState, useEffect, useCallback, useRef } from 'react'
import { getMetrics, toggleTime, getLogs, triggerMotion } from './api'
import LightMap from './components/LightMap'
import ExpenseDashboard from './components/ExpenseDashboard'
import EnergyTracker from './components/EnergyTracker'

const TICK_MS = 1000        // 1-second simulation tick
const MAX_CHART_POINTS = 60 // Keep last 60 seconds of chart history

// Compute live wattage for a single light given its current mode
function lightWattage(light) {
  if (light.mode === 'motion_triggered') return 150 * (light.brightness_pct / 100)
  if (light.mode === 'night_standby') return 15   // 10% of 150W
  return 0
}

export default function App() {
  const [metrics, setMetrics] = useState(null)
  const [lights, setLights] = useState([])
  const [isNight, setIsNight] = useState(true)
  const [chartData, setChartData] = useState([])
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const [hasFault, setHasFault] = useState(false)
  
  // Navigation: 'simulation' | 'dashboard'
  const [activeView, setActiveView] = useState('simulation')
  const tickRef = useRef(0)

  // ── Fetch latest metrics and logs from backend ──────────────────────────────
  const fetchMetricsAndLogs = useCallback(async () => {
    try {
      const [metricData, logData] = await Promise.all([getMetrics(), getLogs()])
      
      setMetrics(metricData)
      setLights(metricData.lights)
      setIsNight(metricData.is_night)
      setLogs(logData)
      setError(null)

      // Append a new chart datapoint
      const totalSmartW = metricData.lights.reduce((sum, l) => sum + lightWattage(l), 0)
      const totalTradW = 150 * 5  // 5 poles × 150W
      tickRef.current += 1
      
      setChartData(prev => {
        const next = [
          ...prev,
          { t: tickRef.current, smart: totalSmartW, traditional: totalTradW },
        ]
        return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next
      })
    } catch (err) {
      setError('System Telemetry Unreachable — ensure backend service is active on port 8000.')
    }
  }, [])

  // ── 1-second simulation tick ───────────────────────────────────────────────
  useEffect(() => {
    fetchMetricsAndLogs()
    const interval = setInterval(fetchMetricsAndLogs, TICK_MS)
    return () => clearInterval(interval)
  }, [fetchMetricsAndLogs])

  // ── Toggle Day / Night ─────────────────────────────────────────────────────
  const handleToggleTime = async () => {
    setToggling(true)
    try {
      await toggleTime()
      tickRef.current = 0
      setChartData([])
      await fetchMetricsAndLogs()
    } finally {
      setToggling(false)
    }
  }

  // ── Triggered by child light buttons — immediate refetch ───────────────────
  const handleLightChanged = useCallback(() => {
    fetchMetricsAndLogs()
  }, [fetchMetricsAndLogs])

  // ── Trigger Motion from Admin Panel ────────────────────────────────────────
  const handleAdminTrigger = async (lightId, objectType) => {
    if (!isNight) return
    try {
      await triggerMotion(lightId, objectType)
      await fetchMetricsAndLogs()
    } catch (err) {
      console.error("Failed to trigger motion from admin board", err)
    }
  }

  // ── Online status indicator ────────────────────────────────────────────────
  const onlineIndicator = error ? (
    <span className="flex items-center gap-1.5 text-xs text-rose-400 font-mono font-medium">
      <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      TELEMETRY DISCONNECTED
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-medium">
      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      LIVE FEED ACTIVE
    </span>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* ── Official Government Banner ────────────────────────────────────────── */}
      <div className="gov-banner px-6 py-1.5 flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>🏛️</span>
          <span>An official administrative portal of the Department of Public Works</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Secure Session (SSL/TLS-1.3)</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-[9px]">REGIONAL-ZONE: 4B</span>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Header ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-900 bg-slate-900/20 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded border border-slate-800 bg-slate-900 flex items-center justify-center">
              <span className="text-slate-100 text-xs font-mono font-bold">DPW</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
                METROPOLITAN LIGHTING GRID CONTROL
              </h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Municipal Autonomous IoT Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Time Controls */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Tab Selection buttons */}
          <div className="bg-slate-900 border border-slate-800/80 p-1 flex gap-1 rounded">
            <button
              onClick={() => setActiveView('simulation')}
              className={`tab-btn ${activeView === 'simulation' ? 'active' : ''}`}
            >
              🖥️ Live Control Center
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`tab-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            >
              📊 Municipal Dashboard
            </button>
          </div>

          <div className="flex items-center gap-4 border-l border-slate-900 pl-4">
            {onlineIndicator}

            {/* Time Toggle */}
            <button
              className={`btn-primary text-xs ${isNight ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-slate-100 text-slate-950 border-slate-200'}`}
              onClick={handleToggleTime}
              disabled={toggling}
              id="btn-toggle-time"
            >
              {toggling ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : isNight ? (
                '☀️ Switch to Day Mode'
              ) : (
                '🌙 Switch to Night Mode'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Error Banner ───────────────────────────────────────────────────── */}
      {error && (
        <div className="border-b border-rose-500/20 bg-rose-950/10 px-6 py-2.5 text-xs text-rose-300 flex items-center gap-2 flex-shrink-0">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── Content Viewport ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        
        {activeView === 'simulation' ? (
          /* Tab 1: Full-Screen Simulation View */
          <div className="absolute inset-0 w-full h-full">
            <LightMap 
              lights={lights} 
              isNight={isNight} 
              onLightChanged={handleLightChanged} 
              logs={logs}
              hasFault={hasFault}
              setHasFault={setHasFault}
            />
          </div>
        ) : (
          /* Tab 2: Municipal Dashboard View */
          <div className="h-full overflow-y-auto w-full px-6 py-6 flex flex-col gap-6">
            <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-6">
              
              {/* Top Summary cards - Municipal Metrics */}
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Active Light Nodes', value: lights.filter(l => l.mode !== 'day').length, unit: `/ ${lights.length} Nodes`, icon: '💡', sub: 'Standby or Active' },
                    { label: 'Live Traffic Triggers', value: lights.filter(l => l.mode === 'motion_triggered').length, unit: 'Active Spotlights', icon: '🚗', sub: 'Dynamic high-beam' },
                    { label: 'Smart Grid Draw', value: `${lights.reduce((s, l) => s + lightWattage(l), 0)}`, unit: 'Watts', icon: '⚡', sub: `Saved ${Number(metrics.energy_saved_pct).toFixed(1)}% vs Trad` },
                    { label: 'System Uptime', value: `${Number(metrics.simulation_seconds).toFixed(0)}`, unit: 'Seconds', icon: '⏱', sub: 'Active session tracker' },
                  ].map(({ label, value, unit, icon, sub }) => (
                    <div key={label} className="glass-card p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-center text-lg">
                        {icon}
                      </div>
                      <div>
                        <p className="section-header text-[10px] text-slate-500 mb-0.5">{label}</p>
                        <p className="metric-value text-xl font-bold text-slate-200">
                          {value} <span className="text-xs text-slate-500 font-normal">{unit}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Energy analytics, charts, financial details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnergyTracker metrics={metrics} chartData={chartData} />
                <ExpenseDashboard metrics={metrics} />
              </div>

              {/* Grid Management Table & Audit Trail split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1 & 2: Streetlight Grid Management Table */}
                <div className="lg:col-span-2 glass-card p-6 flex flex-col gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-200 tracking-tight">Streetlight Hardware Node Registry</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage intelligent light poles, status overrides, and sensor configurations.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-800 rounded">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>Pole ID</th>
                          <th>Status Badge</th>
                          <th className="text-right">Brightness</th>
                          <th className="text-right">Wattage</th>
                          <th className="text-right">Cooldown</th>
                          <th className="text-center">Manual Sensor Trigger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lights.map((l) => {
                          const isDay = l.mode === 'day'
                          const isMotion = l.mode === 'motion_triggered'
                          const isStandby = l.mode === 'night_standby'
                          const isFaulty = l.light_id === 3 && hasFault
                          
                          const secondsLeft = l.motion_expires_at
                            ? Math.max(0, Math.ceil(l.motion_expires_at - Date.now() / 1000))
                            : 0

                          return (
                            <tr key={l.light_id}>
                              <td className={`font-mono font-bold ${isFaulty ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>NODE L-{l.light_id} {isFaulty && '🚨'}</td>
                              <td>
                                <span className={`badge ${
                                  isFaulty ? 'bg-red-950/40 text-red-400 border-red-900/40 shadow-[0_0_8px_rgba(239,68,68,0.25)] animate-pulse' : isMotion ? 'badge-active' : isStandby ? 'badge-standby' : 'badge-day'
                                }`}>
                                  {isFaulty ? '● Fault Detected' : isMotion ? '● Spotlight Active' : isStandby ? '⊙ Night Standby' : '○ Disabled (Day)'}
                                </span>
                              </td>
                              <td className="text-right font-mono font-semibold text-slate-200">{isFaulty ? 0 : l.brightness_pct}%</td>
                              <td className="text-right font-mono text-slate-300">{isFaulty ? 0 : lightWattage(l)}W</td>
                              <td className="text-right font-mono text-slate-400">
                                {isMotion && secondsLeft > 0 ? `${secondsLeft}s` : '—'}
                              </td>
                              <td className="flex gap-2 justify-center">
                                <button
                                  className="btn-primary py-1 px-3 text-[10px]"
                                  disabled={!isNight}
                                  onClick={() => handleAdminTrigger(l.light_id, 'pedestrian')}
                                  title="Trigger Pedestrian Motion"
                                >
                                  🚶 Ped
                                </button>
                                <button
                                  className="btn-primary py-1 px-3 text-[10px]"
                                  disabled={!isNight}
                                  onClick={() => handleAdminTrigger(l.light_id, 'vehicle')}
                                  title="Trigger Vehicle Motion"
                                >
                                  🚗 Car
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 3: Live Audit Trail / Event Log */}
                <div className="glass-card p-6 flex flex-col gap-4 h-[350px] lg:h-auto">
                  <div>
                    <h2 className="text-sm font-bold text-slate-200 tracking-tight">System Audit Log</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time persistent IoT telemetry logs from database.</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto border border-slate-800 rounded bg-slate-950/40 p-4 scrollbar-thin">
                    {logs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-600 italic">
                        No recent telemetry logs…
                      </div>
                    ) : (
                      <div className="log-stream">
                        {logs.map((log) => {
                          const timeStr = new Date(log.timestamp).toLocaleTimeString()
                          let typeClass = 'system'
                          let label = 'SYSTEM'
                          
                          if (log.event_type === 'motion') {
                            typeClass = 'motion'
                            label = 'MOTION DETECTED'
                          } else if (log.event_type === 'standby') {
                            typeClass = 'standby'
                            label = 'STANDBY GLOW'
                          } else if (log.event_type === 'day_on') {
                            typeClass = 'system'
                            label = 'DAY SHUTDOWN'
                          }

                          return (
                            <div key={log.id} className={`log-item ${typeClass}`}>
                              <span className="text-[9px] text-slate-500 mr-2">{timeStr}</span>
                              <strong className="text-[10px] mr-1">[{label}]</strong>
                              <span>
                                Pole L-{log.light_id} set to {log.brightness_pct}% brightness 
                                {log.kwh_delta > 0 && ` (+${log.kwh_delta.toFixed(5)} kWh)`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* ── Footer ─────────────────────────────────────────────────────────── */}
              <footer className="text-center text-[10px] text-slate-600 font-mono py-8 border-t border-slate-900/60 mt-4">
                SMARTGRID MUNICIPAL TELEMETRY CONSOLE · STACK: FASTAPI + VITE/REACT · SQLITE STORAGE
              </footer>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}
