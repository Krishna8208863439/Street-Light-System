import { useState, useEffect, useRef } from 'react'
import { triggerMotion } from '../api'

const MOTION_COOLDOWN = 10 // seconds, must match backend constant

/**
 * LightPole — Renders an intelligent streetlight node with professional neutral styling,
 * volumetric lighting effects, active countdowns, and quick sensor overrides.
 */
function LightPole({ light, isNight, onTriggered, isFaulty }) {
  const { light_id, mode, brightness_pct, motion_expires_at } = light

  const isDay = mode === 'day'
  const isMotion = mode === 'motion_triggered' && !isFaulty
  const isStandby = mode === 'night_standby' && !isFaulty

  // Glow styling parameters
  const glowColor = isFaulty ? '#ef4444' : isMotion ? '#d97706' : '#94a3b8' // Red vs Amber vs cool white-slate
  const glowOpacity = isFaulty ? 0.6 : isMotion ? (brightness_pct / 100) * 0.35 : isStandby ? 0.08 : 0

  // Countdown: seconds remaining
  const secondsLeft = motion_expires_at
    ? Math.max(0, Math.ceil(motion_expires_at - Date.now() / 1000))
    : 0

  const ringCircumference = 87.96
  const ringDash = ringCircumference * (secondsLeft / MOTION_COOLDOWN)

  const handleTrigger = async (object_type) => {
    if (!isNight || isFaulty) return
    await triggerMotion(light_id, object_type)
    onTriggered()
  }

  return (
    <div className="flex flex-col items-center gap-2 select-none group relative" id={`light-pole-${light_id}`}>
      
      {/* Light Pole Frame */}
      <div className="relative w-20 h-64 flex flex-col items-center justify-end">
        
        {/* Volumetric spotlight beam stretching down to the road */}
        {!isDay && (
          <div
            className={`absolute top-[68px] -translate-x-1/2 w-48 h-80 pointer-events-none transition-all duration-500 rounded-full ${
              isFaulty ? 'light-beam-fault opacity-100' : isMotion ? 'light-beam-motion' : isStandby ? 'light-beam-standby opacity-100' : 'opacity-0'
            }`}
            style={{ 
              left: '50%', 
              opacity: isFaulty ? 0.7 : isMotion ? (brightness_pct / 100) : undefined,
              background: isFaulty ? 'linear-gradient(to bottom, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0) 80%)' : undefined
            }}
          />
        )}

        {/* Cooldown Ring Overlay (positioned above the lamp head) */}
        {isMotion && secondsLeft > 0 && (
          <div className="absolute top-0 z-20 flex flex-col items-center">
            <svg width="28" height="28" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringCircumference}`}
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dasharray 0.95s linear' }}
              />
              <text x="18" y="22" textAnchor="middle" fontSize="11" fontWeight="600" fill="#cbd5e1" fontFamily="JetBrains Mono">
                {secondsLeft}
              </text>
            </svg>
          </div>
        )}

        {/* Lamp head and fixture */}
        <div className="relative z-10 mb-auto mt-10">
          
          {/* Corona background glow */}
          {!isDay && (
            <div
              className={`absolute rounded-full transition-all duration-500 ${isFaulty ? 'light-motion bg-red-500/20' : isMotion ? 'light-motion' : 'light-standby'}`}
              style={{
                background: `radial-gradient(circle, ${glowColor}50 0%, transparent 70%)`,
                width: isFaulty ? '4.5rem' : isMotion ? `${6 * (brightness_pct / 100)}rem` : '3.5rem',
                height: isFaulty ? '4.5rem' : isMotion ? `${6 * (brightness_pct / 100)}rem` : '3.5rem',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(4px)'
              }}
            />
          )}

          {/* Lamp fixture SVG */}
          <svg width="34" height="24" viewBox="0 0 40 28" className="relative z-10">
            {/* Main Shade */}
            <path
              d="M3 16 L20 4 L37 16 L33 22 L7 22 Z"
              fill={isDay ? '#0f172a' : isFaulty ? '#220c0c' : isMotion ? '#1e1b13' : '#111827'}
              stroke={isFaulty ? '#ef4444' : isMotion ? '#d97706' : isStandby ? '#475569' : '#1e293b'}
              strokeWidth="2"
            />
            {/* LED Bulb Element */}
            <ellipse
              cx="20" cy="19" rx="7" ry="3.5"
              fill={isFaulty ? '#ef4444' : isDay ? 'transparent' : isMotion ? '#fbbf24' : '#cbd5e1'}
              opacity={isDay ? 0 : isFaulty ? 1 : isMotion ? (brightness_pct / 100) : 0.4}
              style={{ transition: 'all 0.4s ease' }}
            />
          </svg>
        </div>

        {/* Pole arm structure */}
        <div className="w-[3px] flex-1 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 mx-auto" />

        {/* Concrete Pole base anchor */}
        <div className="w-4 h-2 bg-slate-800 border border-slate-700 rounded-t-sm" />
      </div>

      {/* Label and Mode Status (semi-transparent, visible clearly) */}
      <div className="flex flex-col items-center gap-1 z-30">
        <span className={`text-[9px] font-mono tracking-wider ${isFaulty ? 'text-red-500 font-bold animate-pulse' : 'text-slate-500'}`}>
          NODE L-{light_id} {isFaulty && '🚨'}
        </span>
        
        {/* Clean pill badge */}
        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
          isFaulty
            ? 'bg-red-950/40 text-red-400 border-red-900/40 shadow-[0_0_8px_rgba(239,68,68,0.25)] animate-pulse'
            : isMotion 
            ? 'bg-amber-950/40 text-amber-400 border-amber-900/40 shadow-[0_0_8px_rgba(217,119,6,0.15)]'
            : isStandby
            ? 'bg-slate-900/50 text-slate-400 border-slate-800/80'
            : 'bg-slate-950/20 text-slate-600 border-slate-900'
        }`}>
          {isFaulty ? 'FAULT DETECTED' : isMotion ? `${brightness_pct}% ACTV` : isStandby ? '10% STBY' : '0% DAY'}
        </span>
      </div>

      {/* Hover action overlay - reveals pedestrian & car triggers smoothly */}
      <div className="absolute -bottom-12 flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/90 border border-slate-800 p-1 rounded z-40 shadow-xl">
        <button
          className="btn-trigger w-8 h-6 flex items-center justify-center text-[10px] rounded hover:bg-slate-800 text-slate-300 disabled:opacity-20"
          disabled={!isNight || isFaulty}
          onClick={() => handleTrigger('pedestrian')}
          title="Trigger Pedestrian Motion"
        >
          🚶
        </button>
        <button
          className="btn-trigger w-8 h-6 flex items-center justify-center text-[10px] rounded hover:bg-slate-800 text-slate-300 disabled:opacity-20"
          disabled={!isNight || isFaulty}
          onClick={() => handleTrigger('vehicle')}
          title="Trigger Vehicle Motion"
        >
          🚗
        </button>
      </div>

    </div>
  )
}

/**
 * LightMap — Full-screen Command & Telemetry Center.
 * Incorporates simulated physics, auto-spawning, dynamic lighting overlays,
 * and double floating information terminals (Console controls and real-time logs).
 */
export default function LightMap({ lights, isNight, onLightChanged, logs, hasFault, setHasFault }) {
  const [cars, setCars] = useState([])
  const [humans, setHumans] = useState([])
  const [autoTraffic, setAutoTraffic] = useState(true)
  const animationRef = useRef()

  // Spawns a new vehicle with randomized parameters
  const spawnCar = () => {
    const newCar = {
      id: Date.now() + Math.random(),
      position: -10, // Start off-screen left
      speed: 0.14 + Math.random() * 0.1, // Slow elegant telemetry driving speed
      type: Math.random() > 0.7 ? 'truck' : Math.random() > 0.45 ? 'sports' : 'sedan',
      color: Math.random() > 0.7 ? '#e2e8f0' : Math.random() > 0.45 ? '#94a3b8' : '#475569',
      triggered: [], // Tracking which poles have been triggered
    }
    setCars(prev => [...prev, newCar])
  }

  // Spawns a new pedestrian
  const spawnHuman = () => {
    const newHuman = {
      id: Date.now() + Math.random(),
      position: -10, // Start off-screen left
      speed: 0.05 + Math.random() * 0.02, // Walking speed
      triggered: [],
    }
    setHumans(prev => [...prev, newHuman])
  }

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25)
      
      osc.start()
      osc.stop(audioCtx.currentTime + 0.25)
      
      setTimeout(() => {
        audioCtx.close().catch(() => {})
      }, 300)
    } catch (e) {
      console.warn("Web Audio API not supported or blocked by user gesture:", e)
    }
  }

  const spawnFault = () => {
    setHasFault(prev => !prev)
  }

  useEffect(() => {
    if (!hasFault) return

    playBeep()
    const interval = setInterval(playBeep, 1000)

    return () => clearInterval(interval)
  }, [hasFault])

  // Animation frame updater
  useEffect(() => {
    let active = true

    const updateSimulation = () => {
      // Update Cars
      setCars(prevCars => {
        if (prevCars.length === 0) return prevCars

        const updated = prevCars.map(car => {
          const nextPos = car.position + car.speed
          const triggered = [...car.triggered]
          const poles = [10, 30, 50, 70, 90]

          poles.forEach((poleX, idx) => {
            const poleId = idx + 1
            if (nextPos >= poleX && !triggered.includes(poleId)) {
              triggered.push(poleId)
              if (isNight) {
                triggerMotion(poleId, 'vehicle')
                  .then(() => onLightChanged())
                  .catch(() => {})
              }
            }
          })

          return { ...car, position: nextPos, triggered }
        })

        return updated.filter(car => car.position <= 110)
      })

      // Update Humans
      setHumans(prevHumans => {
        if (prevHumans.length === 0) return prevHumans

        const updated = prevHumans.map(human => {
          const nextPos = human.position + human.speed
          const triggered = [...human.triggered]
          const poles = [10, 30, 50, 70, 90]

          poles.forEach((poleX, idx) => {
            const poleId = idx + 1
            if (nextPos >= poleX && !triggered.includes(poleId)) {
              triggered.push(poleId)
              if (isNight) {
                triggerMotion(poleId, 'pedestrian')
                  .then(() => onLightChanged())
                  .catch(() => {})
              }
            }
          })

          return { ...human, position: nextPos, triggered }
        })

        return updated.filter(human => human.position <= 110)
      })

      if (active) {
        animationRef.current = requestAnimationFrame(updateSimulation)
      }
    }

    if (cars.length > 0 || humans.length > 0) {
      animationRef.current = requestAnimationFrame(updateSimulation)
    }

    return () => {
      active = false
      cancelAnimationFrame(animationRef.current)
    }
  }, [cars.length, humans.length, isNight, onLightChanged])

  // Autopilot spawning loop
  useEffect(() => {
    if (!autoTraffic) return

    const interval = setInterval(() => {
      setCars(prev => {
        if (prev.length < 3) {
          spawnCar()
        }
        return prev
      })
    }, 4000 + Math.random() * 2500)

    return () => clearInterval(interval)
  }, [autoTraffic])

  const clearCars = () => {
    setCars([])
    setHumans([])
  }

  return (
    <div className="w-full h-full relative bg-slate-950 grid-pattern flex flex-col justify-end overflow-hidden" id="light-map">
      
      {/* ── Sky/Atmospheric Backdrop ────────────────────────────────────────── */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-[2000ms] pointer-events-none"
        style={{
          background: isNight
            ? 'linear-gradient(to bottom, #020617 0%, #090d16 65%, #0f1422 100%)'
            : 'linear-gradient(to bottom, #e2e8f0 0%, #cbd5e1 60%, #94a3b8 100%)'
        }}
      />

      {/* ── Vector City Skyline Silhouette ───────────────────────────────────── */}
      <div className="absolute bottom-24 left-0 right-0 h-32 opacity-[0.08] pointer-events-none z-5 transition-all duration-[2000ms]">
        <svg width="100%" height="100%" viewBox="0 0 1000 100" preserveAspectRatio="none" fill={isNight ? '#cbd5e1' : '#1e293b'}>
          <rect x="20" y="35" width="35" height="65" />
          <rect x="70" y="15" width="45" height="85" />
          <rect x="130" y="50" width="30" height="50" />
          <rect x="180" y="25" width="55" height="75" />
          <rect x="260" y="40" width="40" height="60" />
          <rect x="320" y="10" width="50" height="90" />
          <rect x="390" y="45" width="35" height="55" />
          <rect x="440" y="20" width="60" height="80" />
          <rect x="520" y="30" width="40" height="70" />
          <rect x="580" y="15" width="45" height="85" />
          <rect x="640" y="50" width="30" height="50" />
          <rect x="690" y="5" width="55" height="95" />
          <rect x="765" y="35" width="40" height="65" />
          <rect x="820" y="20" width="50" height="80" />
          <rect x="890" y="40" width="35" height="60" />
          <rect x="940" y="10" width="40" height="90" />
        </svg>
      </div>

      {/* ── FLOATING PANEL A: Live Command Console ────────────────────────────── */}
      <div className="absolute top-6 left-6 w-80 floating-panel p-5 flex flex-col gap-4 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold tracking-tight text-slate-200">GRID CONTROL PANEL</span>
            <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">V1.4</span>
          </div>
          <p className="text-[10px] text-slate-500">Autonomous sensor override and simulation controls.</p>
        </div>

        {/* Autopilot Controller */}
        <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 p-2.5 rounded">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoTraffic ? 'bg-emerald-400' : 'bg-slate-600'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${autoTraffic ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className="font-mono font-bold text-slate-300">AUTO VEHICLE FLOW</span>
          </div>
          <button
            onClick={() => setAutoTraffic(!autoTraffic)}
            className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded transition-all duration-200 ${
              autoTraffic 
                ? 'bg-slate-200 text-slate-950 hover:bg-slate-100' 
                : 'bg-slate-850 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {autoTraffic ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Spawn Controls */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={spawnCar}
            className="btn-primary py-2 px-1 text-[9px] flex items-center justify-center gap-1"
          >
            <span>Spawn Car</span>
            <span>🚗</span>
          </button>
          <button
            onClick={spawnHuman}
            className="btn-primary py-2 px-1 text-[9px] flex items-center justify-center gap-1"
          >
            <span>Spawn Human</span>
            <span>🚶</span>
          </button>
          <button
            onClick={spawnFault}
            className="btn-primary py-2 px-1 text-[9px] flex items-center justify-center gap-1 bg-red-950/40 border-red-900/40 text-red-400 hover:bg-red-900/30 animate-pulse"
          >
            <span>Spawn Fault</span>
            <span>⚡</span>
          </button>
          <button
            onClick={clearCars}
            className="btn-primary py-2 px-1 text-[9px] flex items-center justify-center gap-1 bg-slate-950"
            disabled={cars.length === 0 && humans.length === 0}
          >
            <span>Clear Grid</span>
            <span>🧹</span>
          </button>
        </div>
      </div>

      {/* ── FLOATING PANEL B: Telemetry Stats ─────────────────────────────────── */}
      <div className="absolute top-6 right-6 w-72 floating-panel p-5 flex flex-col gap-3 text-xs">
        <span className="font-bold tracking-tight text-slate-200">REAL-TIME GRID TELEMETRY</span>
        
        <div className="flex flex-col gap-2 font-mono">
          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
            <span>Active Lights</span>
            <span className="text-slate-200 font-bold">{lights.filter(l => l.mode !== 'day').length} / {lights.length}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
            <span>Vehicles On Screen</span>
            <span className="text-slate-200 font-bold">{cars.length}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
            <span>Pedestrians On Screen</span>
            <span className="text-slate-200 font-bold">{humans.length}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
            <span>Smart Grid Power</span>
            <span className="text-amber-400 font-bold">
              {lights.reduce((sum, l) => {
                if (l.mode === 'motion_triggered') return sum + 150 * (l.brightness_pct / 100)
                if (l.mode === 'night_standby') return sum + 15
                return sum
              }, 0)} W
            </span>
          </div>
          {hasFault && (
            <div className="flex justify-between border-b border-slate-900 pb-1.5 text-rose-500 font-bold animate-pulse">
              <span>Fault Detect</span>
              <span className="text-rose-500 font-bold font-mono">node L-3</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Operating Environment</span>
            <span className={`font-bold ${isNight ? 'text-indigo-400' : 'text-amber-500'}`}>
              {isNight ? '🌙 NIGHT STANDBY' : '☀️ DAY TIMEOUT'}
            </span>
          </div>
        </div>
      </div>

      {/* ── FLOATING PANEL C: Mini Log Feed ──────────────────────────────────── */}
      <div className="absolute bottom-28 right-6 w-80 floating-panel p-4 flex flex-col gap-2.5 max-h-44 overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IoT Sensor Audit Trail</span>
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin select-text">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[10px] text-slate-600 italic">
              Awaiting telemetry signals…
            </div>
          ) : (
            <div className="log-stream">
              {logs.slice(0, 10).map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                let isMot = log.event_type === 'motion'
                return (
                  <div key={log.id} className="text-[10px] leading-relaxed mb-1 border-l border-slate-800 pl-2 text-slate-500">
                    <span className="font-mono text-slate-600 mr-1.5">{timeStr}</span>
                    <span className={isMot ? 'text-amber-500/80 font-semibold' : 'text-slate-400'}>
                      {isMot ? `[MOTION] Node L-${log.light_id} active` : `[STBY] Node L-${log.light_id} standby`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Interactive Highway & Lights Canvas ──────────────────────────────── */}
      <div className="w-full relative h-[480px] flex flex-col justify-end p-6 select-none z-10">
        
        {/* Street Light Nodes Row */}
        <div className="flex items-end justify-around w-full relative z-20 pb-20">
          {lights.map((light) => (
            <LightPole
              key={light.light_id}
              light={light}
              isNight={isNight}
              onTriggered={onLightChanged}
              isFaulty={light.light_id === 3 && hasFault}
            />
          ))}
        </div>

        {/* Animated Vehicles Highway Layer */}
        <div className="absolute bottom-8 left-0 right-0 h-10 pointer-events-none z-30 overflow-visible">
          {cars.map(car => (
            <div
              key={car.id}
              className="absolute transition-transform duration-75"
              style={{
                left: `${car.position}%`,
                transform: `translateX(-50%)`,
                bottom: car.type === 'truck' ? '2px' : '0px',
              }}
            >
              <div className="flex items-center relative">
                
                {/* Glowing vehicle headlights */}
                {isNight && (
                  <div
                    className="absolute left-[85%] top-1/2 -translate-y-1/2 h-20 w-40"
                    style={{
                      background: 'radial-gradient(ellipse at left, rgba(254,243,199,0.14) 0%, rgba(254,243,199,0) 70%)',
                      clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)',
                    }}
                  />
                )}
                {/* Red brake taillights */}
                {isNight && (
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]" />
                )}

                {/* Highly refined vector vehicle silhouettes */}
                {car.type === 'truck' ? (
                  <svg width="46" height="20" viewBox="0 0 50 22" fill="none">
                    <path d="M32 4H44L48 11V20H32V4Z" fill={car.color} />
                    <rect x="35" y="6" width="6" height="4" fill="#0f172a" />
                    <rect x="2" y="2" width="30" height="18" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <circle cx="8" cy="20" r="2.5" fill="#020617" stroke="#475569" />
                    <circle cx="26" cy="20" r="2.5" fill="#020617" stroke="#475569" />
                    <circle cx="40" cy="20" r="2.5" fill="#020617" stroke="#475569" />
                  </svg>
                ) : car.type === 'sports' ? (
                  <svg width="36" height="12" viewBox="0 0 40 13" fill="none">
                    <path d="M2 11C2 11 5 6.5 10 5.5C15 4.5 27 4.5 32 6.5C37 8 39 9.5 39 11.5H1V11Z" fill={car.color} />
                    <path d="M13 6L17 8.5H27L24 6H13Z" fill="#020617" opacity="0.95" />
                    <circle cx="9" cy="11" r="2" fill="#020617" stroke="#475569" />
                    <circle cx="31" cy="11" r="2" fill="#020617" stroke="#475569" />
                  </svg>
                ) : (
                  <svg width="34" height="14" viewBox="0 0 38 15" fill="none">
                    <path d="M1 11C1 9 4 7 8 6H29C33 6 36 9 36 12H1V11Z" fill={car.color} />
                    <path d="M9 6L13 2H24L28 6H9Z" fill={car.color} stroke="#1e293b" strokeWidth="0.5" />
                    <path d="M13.5 2.5H23.5L26 5H11L13.5 2.5Z" fill="#020617" />
                    <circle cx="9" cy="13" r="2" fill="#020617" stroke="#475569" />
                    <circle cx="29" cy="13" r="2" fill="#020617" stroke="#475569" />
                  </svg>
                )}

              </div>
            </div>
          ))}
        </div>

        {/* Animated Pedestrians Layer */}
        <div className="absolute bottom-6 left-0 right-0 h-10 pointer-events-none z-30 overflow-visible">
          {humans.map(human => {
            const sway = Math.sin(human.position * 2.5)
            const leftLegX = 12 + sway * 3
            const rightLegX = 12 - sway * 3
            const leftArmX = 12 - sway * 2.5
            const rightArmX = 12 + sway * 2.5

            return (
              <div
                key={human.id}
                className="absolute transition-transform duration-75"
                style={{
                  left: `${human.position}%`,
                  transform: `translateX(-50%)`,
                  bottom: '0px',
                }}
              >
                <div className="flex items-center relative">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="4" r="2" fill={isNight ? "#e2e8f0" : "#334155"} />
                    <line x1="12" y1="6" x2="12" y2="14" stroke={isNight ? "#e2e8f0" : "#334155"} strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="8" x2={leftArmX} y2="12" stroke={isNight ? "#e2e8f0" : "#334155"} strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="8" x2={rightArmX} y2="12" stroke={isNight ? "#e2e8f0" : "#334155"} strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="14" x2={leftLegX} y2="22" stroke={isNight ? "#e2e8f0" : "#334155"} strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="14" x2={rightLegX} y2="22" stroke={isNight ? "#e2e8f0" : "#334155"} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>

        {/* Concrete Road Surface */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 transition-all duration-[2000ms] z-10"
          style={{
            background: isNight
              ? 'linear-gradient(to bottom, #0f172a 0%, #020617 100%)'
              : 'linear-gradient(to bottom, #94a3b8 0%, #64748b 100%)',
            borderTop: isNight ? '1px solid #1e293b' : '1px solid #94a3b8'
          }}
        >
          {/* Dashed highway markings */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full"
              style={{
                width: '6%',
                left: `${8 + i * 16}%`,
                background: isNight ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

      </div>

    </div>
  )
}
