"""
Intelligent Street Light IoT Dashboard — FastAPI Backend
=========================================================
Manages 5 intelligent streetlight poles, their state machine transitions,
real-time energy/cost metrics, and persists event logs for trend charts.
"""

import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import LightState, EnergyConsumptionLog
from schemas import (
    TriggerMotionRequest,
    SimulationStatusOut,
    LightStateOut,
    MetricsOut,
    EnergyLogOut,
)

# ── Constants ─────────────────────────────────────────────────────────────────

NUM_LIGHTS = 5
MOTION_COOLDOWN_SECONDS = 10
LIGHT_WATTAGE_W = 150.0          # Rated wattage per pole at 100% brightness
STANDBY_FACTOR = 0.10            # 10% brightness → 10% power draw
MOTION_FACTOR = 1.00             # 100% brightness → 100% power draw
GRID_EMISSION_FACTOR = 0.4       # kg CO2 per kWh (average grid)
ELECTRICITY_RATE_INR = 10.0      # INR per kWh

# Simulation start time (epoch seconds) — reset on each server restart
_simulation_start: float = time.time()
# Global night/day flag
_is_night: bool = True


# ── Lifespan: seed DB on startup ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_lights()
    yield


def _seed_lights():
    """Ensure exactly NUM_LIGHTS rows exist in light_states."""
    db = next(get_db())
    try:
        for lid in range(1, NUM_LIGHTS + 1):
            existing = db.query(LightState).filter(LightState.light_id == lid).first()
            if not existing:
                light = LightState(
                    light_id=lid,
                    mode="night_standby",
                    brightness_pct=10.0,
                    motion_expires_at=None,
                )
                db.add(light)
        db.commit()
    finally:
        db.close()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Intelligent Street Light API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper: resolve expired motion triggers ───────────────────────────────────

def _resolve_motion_expiry(light: LightState, db: Session) -> LightState:
    """If a motion-triggered light's cooldown has expired, revert it to standby."""
    if (
        light.mode == "motion_triggered"
        and light.motion_expires_at is not None
        and time.time() >= light.motion_expires_at
    ):
        light.mode = "night_standby"
        light.brightness_pct = 10.0
        light.motion_expires_at = None
        db.add(light)
        db.commit()
        db.refresh(light)
    return light


def _get_all_lights_resolved(db: Session) -> list[LightState]:
    lights = db.query(LightState).order_by(LightState.light_id).all()
    for light in lights:
        _resolve_motion_expiry(light, db)
    return lights


# ── Energy / cost math ────────────────────────────────────────────────────────

def _compute_metrics(lights: list[LightState], simulation_seconds: float) -> MetricsOut:
    """
    Compute real-time energy and financial metrics.
    All energy is calculated relative to the elapsed simulation time,
    scaled to a standard 12-hour night for the traditional baseline.
    """
    sim_hours = simulation_seconds / 3600.0

    # Smart grid: sum actual wattage from each pole
    smart_w_total = sum(
        LIGHT_WATTAGE_W * ((l.brightness_pct / 100.0) if l.mode == "motion_triggered" else
                           STANDBY_FACTOR if l.mode == "night_standby" else 0.0)
        for l in lights
    )
    smart_kwh = (smart_w_total / 1000.0) * sim_hours

    # Traditional grid: all 5 lights at 100% for the same sim period
    traditional_w_total = LIGHT_WATTAGE_W * NUM_LIGHTS
    traditional_kwh = (traditional_w_total / 1000.0) * sim_hours

    kwh_saved = max(0.0, traditional_kwh - smart_kwh)
    energy_saved_pct = (kwh_saved / traditional_kwh * 100.0) if traditional_kwh > 0 else 0.0

    smart_cost = smart_kwh * ELECTRICITY_RATE_INR
    traditional_cost = traditional_kwh * ELECTRICITY_RATE_INR
    cost_saved = max(0.0, traditional_cost - smart_cost)

    # Project: if sim_hours > 0, extrapolate to 30 and 365 day-nights
    if sim_hours > 0:
        rate_saved_per_hour = cost_saved / sim_hours
        projected_monthly = rate_saved_per_hour * 12 * 30   # 12h/night × 30 nights
        projected_annual = rate_saved_per_hour * 12 * 365
    else:
        projected_monthly = 0.0
        projected_annual = 0.0

    return MetricsOut(
        is_night=_is_night,
        smart_kwh_total=round(smart_kwh, 6),
        traditional_kwh_total=round(traditional_kwh, 6),
        kwh_saved=round(kwh_saved, 6),
        energy_saved_pct=round(energy_saved_pct, 2),
        smart_co2_kg=round(smart_kwh * GRID_EMISSION_FACTOR, 6),
        traditional_co2_kg=round(traditional_kwh * GRID_EMISSION_FACTOR, 6),
        co2_saved_kg=round(kwh_saved * GRID_EMISSION_FACTOR, 6),
        smart_cost_inr=round(smart_cost, 6),
        traditional_cost_inr=round(traditional_cost, 6),
        cost_saved_inr=round(cost_saved, 6),
        projected_monthly_savings_inr=round(projected_monthly, 2),
        projected_annual_savings_inr=round(projected_annual, 2),
        simulation_seconds=round(simulation_seconds, 2),
        lights=[
            LightStateOut(
                light_id=l.light_id,
                mode=l.mode,
                brightness_pct=l.brightness_pct,
                motion_expires_at=l.motion_expires_at,
            )
            for l in lights
        ],
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/simulation/status", response_model=SimulationStatusOut)
def get_status(db: Session = Depends(get_db)):
    """Return current night/day flag and live state of all poles."""
    lights = _get_all_lights_resolved(db)
    return SimulationStatusOut(
        is_night=_is_night,
        lights=[
            LightStateOut(
                light_id=l.light_id,
                mode=l.mode,
                brightness_pct=l.brightness_pct,
                motion_expires_at=l.motion_expires_at,
            )
            for l in lights
        ],
    )


@app.post("/api/simulation/toggle-time", response_model=SimulationStatusOut)
def toggle_time(db: Session = Depends(get_db)):
    """
    Toggle global day ↔ night mode.
    • Day: all lights off (0% brightness).
    • Night Standby: all lights dim (10% brightness).
    """
    global _is_night, _simulation_start
    _is_night = not _is_night
    _simulation_start = time.time()

    lights = db.query(LightState).all()
    for light in lights:
        if _is_night:
            light.mode = "night_standby"
            light.brightness_pct = 10.0
        else:
            light.mode = "day"
            light.brightness_pct = 0.0
        light.motion_expires_at = None
        db.add(light)

        db.add(EnergyConsumptionLog(
            light_id=light.light_id,
            event_type="day_on" if not _is_night else "standby",
            brightness_pct=light.brightness_pct,
            kwh_delta=0.0,
        ))

    db.commit()

    lights = _get_all_lights_resolved(db)
    return SimulationStatusOut(
        is_night=_is_night,
        lights=[
            LightStateOut(
                light_id=l.light_id,
                mode=l.mode,
                brightness_pct=l.brightness_pct,
                motion_expires_at=l.motion_expires_at,
            )
            for l in lights
        ],
    )


@app.post("/api/simulation/trigger-motion", response_model=LightStateOut)
def trigger_motion(payload: TriggerMotionRequest, db: Session = Depends(get_db)):
    """
    Transition a specific light to 100% brightness on motion detection.
    Sets a cooldown timer; after MOTION_COOLDOWN_SECONDS the light
    automatically reverts to night standby on the next API call.
    """
    if not _is_night:
        raise HTTPException(status_code=400, detail="Motion triggers are only active in night mode.")

    light = db.query(LightState).filter(LightState.light_id == payload.light_id).first()
    if not light:
        raise HTTPException(status_code=404, detail=f"Light {payload.light_id} not found.")

    light.mode = "motion_triggered"
    if payload.object_type == "pedestrian":
        light.brightness_pct = 60.0
    else:
        light.brightness_pct = 100.0
    light.motion_expires_at = time.time() + MOTION_COOLDOWN_SECONDS
    db.add(light)

    db.add(EnergyConsumptionLog(
        light_id=light.light_id,
        event_type="motion",
        brightness_pct=light.brightness_pct,
        kwh_delta=(LIGHT_WATTAGE_W * (light.brightness_pct / 100.0) / 1000.0) * (MOTION_COOLDOWN_SECONDS / 3600.0),
    ))
    db.commit()
    db.refresh(light)

    return LightStateOut(
        light_id=light.light_id,
        mode=light.mode,
        brightness_pct=light.brightness_pct,
        motion_expires_at=light.motion_expires_at,
    )


@app.get("/api/simulation/metrics", response_model=MetricsOut)
def get_metrics(db: Session = Depends(get_db)):
    """Compute and return live energy, cost, and savings metrics."""
    lights = _get_all_lights_resolved(db)
    simulation_seconds = time.time() - _simulation_start
    return _compute_metrics(lights, simulation_seconds)


@app.get("/api/simulation/logs", response_model=list[EnergyLogOut])
def get_logs(db: Session = Depends(get_db)):
    """Retrieve the latest 30 energy consumption logs."""
    return db.query(EnergyConsumptionLog).order_by(EnergyConsumptionLog.timestamp.desc()).limit(30).all()

