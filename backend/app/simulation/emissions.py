"""
emissions.py — Realistic fuel consumption, greenhouse gas emissions, and Level of Service (LOS) models.

Based on:
- VT-Micro / EPA Comprehensive Modal Emissions Models (CMEM) for speed-dependent fuel rates
- Highway Capacity Manual (HCM 2010/2016) Level of Service classification based on V/C ratios
"""

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class EmissionMetrics:
    fuel_liters: float
    co2_kg: float
    nox_grams: float
    avg_speed_kmph: float
    level_of_service: str  # LOS A, B, C, D, E, F


VEHICLE_FUEL_FACTORS: Dict[str, float] = {
    "Cars": 1.0,
    "Mixed": 1.15,
    "Bikes": 0.35,
    "Vans": 1.45,
    "Lorries": 3.20,
    "Emergency": 1.25,
}

VEHICLE_PCE: Dict[str, float] = {
    "Cars": 1.0,
    "Mixed": 1.1,
    "Bikes": 0.5,
    "Vans": 1.5,
    "Lorries": 2.5,
    "Emergency": 1.2,
}


def compute_fuel_rate_l_per_100km(speed_kmph: float, vehicle_type: str = "Cars") -> float:
    """
    Speed-dependent fuel consumption rate in Liters per 100 km.
    Accounts for engine idling inefficiency in severe congestion (<15 km/h)
    and aerodynamic drag at high speeds (>90 km/h).
    """
    v = max(5.0, min(140.0, speed_kmph))
    
    # VT-Micro polynomial approximation for passenger vehicles (L/100km)
    if v < 15.0:
        base_rate = 22.0 - (v * 0.6)  # High idle fuel consumption
    elif v <= 60.0:
        base_rate = 13.0 - (0.18 * v) + (0.0012 * (v ** 2))
    elif v <= 90.0:
        base_rate = 6.8 + (0.015 * (v - 60.0))  # Optimal cruise band
    else:
        base_rate = 7.25 + (0.0006 * ((v - 80.0) ** 2))  # Aerodynamic drag penalty

    type_factor = VEHICLE_FUEL_FACTORS.get(vehicle_type, 1.0)
    return max(3.5, base_rate * type_factor)


def compute_route_emissions(
    distance_km: float,
    travel_time_min: float,
    vehicle_type: str = "Cars",
    vc_ratio: float = 0.5,
) -> EmissionMetrics:
    """
    Calculates fuel consumption, CO2 footprint, NOx emissions, and Highway Level of Service (LOS).
    """
    if distance_km <= 0 or travel_time_min <= 0:
        return EmissionMetrics(
            fuel_liters=0.0,
            co2_kg=0.0,
            nox_grams=0.0,
            avg_speed_kmph=50.0,
            level_of_service="LOS A",
        )

    avg_speed_kmph = (distance_km / travel_time_min) * 60.0
    fuel_rate = compute_fuel_rate_l_per_100km(avg_speed_kmph, vehicle_type)
    fuel_liters = (distance_km * fuel_rate) / 100.0

    # 1 Liter of gasoline produces ~2.31 kg CO2, 1 Liter of diesel produces ~2.68 kg CO2
    co2_factor = 2.45 if vehicle_type in ("Lorries", "Vans") else 2.31
    co2_kg = fuel_liters * co2_factor

    # NOx emissions (g/km) inversely proportional to combustion efficiency in stop-and-go
    nox_rate = 0.12 if avg_speed_kmph > 40 else (0.28 if avg_speed_kmph > 20 else 0.45)
    nox_grams = distance_km * nox_rate * VEHICLE_FUEL_FACTORS.get(vehicle_type, 1.0)

    # Highway Capacity Manual (HCM) Level of Service (LOS)
    if vc_ratio <= 0.35:
        los = "LOS A"
    elif vc_ratio <= 0.60:
        los = "LOS B"
    elif vc_ratio <= 0.75:
        los = "LOS C"
    elif vc_ratio <= 0.90:
        los = "LOS D"
    elif vc_ratio <= 1.00:
        los = "LOS E"
    else:
        los = "LOS F (Breakdown)"

    return EmissionMetrics(
        fuel_liters=round(fuel_liters, 3),
        co2_kg=round(co2_kg, 3),
        nox_grams=round(nox_grams, 2),
        avg_speed_kmph=round(avg_speed_kmph, 1),
        level_of_service=los,
    )
