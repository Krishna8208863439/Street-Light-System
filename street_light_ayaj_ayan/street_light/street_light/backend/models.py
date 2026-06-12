from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class LightState(Base):
    """Tracks the current operational state of each intelligent streetlight pole."""

    __tablename__ = "light_states"

    id = Column(Integer, primary_key=True, index=True)
    light_id = Column(Integer, unique=True, index=True, nullable=False)
    # Modes: "day" | "night_standby" | "motion_triggered"
    mode = Column(String, nullable=False, default="night_standby")
    brightness_pct = Column(Float, nullable=False, default=10.0)
    # When motion was triggered, countdown ends at this epoch second
    motion_expires_at = Column(Float, nullable=True, default=None)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EnergyConsumptionLog(Base):
    """Persistent history of energy events for trend charts and expense calculations."""

    __tablename__ = "energy_consumption_logs"

    id = Column(Integer, primary_key=True, index=True)
    light_id = Column(Integer, index=True, nullable=False)
    event_type = Column(String, nullable=False)  # "day_on" | "day_off" | "motion" | "standby"
    brightness_pct = Column(Float, nullable=False)
    # kWh accumulated since last log entry for this light
    kwh_delta = Column(Float, nullable=False, default=0.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
