from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


# ── Request Schemas ───────────────────────────────────────────────────────────

class TriggerMotionRequest(BaseModel):
    light_id: int
    object_type: Literal["pedestrian", "vehicle"]


# ── Response Schemas ──────────────────────────────────────────────────────────

class LightStateOut(BaseModel):
    light_id: int
    mode: str
    brightness_pct: float
    motion_expires_at: Optional[float]

    class Config:
        from_attributes = True


class SimulationStatusOut(BaseModel):
    is_night: bool
    lights: list[LightStateOut]


class MetricsOut(BaseModel):
    is_night: bool
    # Energy
    smart_kwh_total: float
    traditional_kwh_total: float
    kwh_saved: float
    energy_saved_pct: float
    # Carbon (kg CO2 @ 0.4 kg/kWh grid factor)
    smart_co2_kg: float
    traditional_co2_kg: float
    co2_saved_kg: float
    # Financials (INR @ ₹10.00 / kWh)
    smart_cost_inr: float
    traditional_cost_inr: float
    cost_saved_inr: float
    projected_monthly_savings_inr: float
    projected_annual_savings_inr: float
    # Simulation runtime in seconds
    simulation_seconds: float
    # Per-light snapshot
    lights: list[LightStateOut]


class EnergyLogOut(BaseModel):
    id: int
    light_id: int
    event_type: str
    brightness_pct: float
    kwh_delta: float
    timestamp: datetime

    class Config:
        from_attributes = True

