"""
evaluator.py — Route metrics evaluator with environmental and kinematics physics (SIH26137).

Calculates:
    D(R) = Total physical distance (km)
    T(R) = Total BPR + Akçelik travel time (min)
    T_free = Free flow travel time (min)
    T_delay = Congestion delay (min) = T - T_free
    Fuel(R) = Vehicle-specific fuel consumption (Liters)
    CO2(R) = Greenhouse gas carbon footprint (kg CO2)
    LOS = Highway Capacity Manual Level of Service (LOS A through F)
"""

from dataclasses import dataclass, field
from typing import List, Optional

from app.simulation.emissions import VEHICLE_BASE_SPEEDS, compute_route_emissions
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel


@dataclass
class RouteMetrics:
    path: List[str]
    distance_km: float = 0.0
    time_min: float = 0.0
    free_flow_time_min: float = 0.0
    delay_min: float = 0.0
    congestion: float = 0.0
    fuel_liters: float = 0.0
    co2_kg: float = 0.0
    avg_speed_kmph: float = 0.0
    level_of_service: str = "LOS A"
    edges_used: int = 0
    broken_edges: List[str] = field(default_factory=list)

    def __repr__(self) -> str:
        return (
            f"RouteMetrics(path={'->'.join(self.path)}, "
            f"dist={self.distance_km:.2f}km, "
            f"time={self.time_min:.2f}min, "
            f"delay={self.delay_min:.2f}min, "
            f"fuel={self.fuel_liters:.2f}L, "
            f"CO2={self.co2_kg:.2f}kg, "
            f"{self.level_of_service})"
        )


def evaluate_route(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    path: List[str],
    vehicle_type: str = "Cars",
) -> RouteMetrics:
    """
    Evaluates comprehensive physical, kinematics, and environmental metrics along a candidate path
    accounting for vehicle capabilities, lane widths, road conditions, and congestion.
    """
    metrics = RouteMetrics(path=list(path))

    if len(path) < 2:
        return metrics

    total_vc = 0.0
    base_vehicle_speed = VEHICLE_BASE_SPEEDS.get(vehicle_type, 50.0)

    for source, target in zip(path[:-1], path[1:]):
        if not network.road_exists(source, target):
            metrics.broken_edges.append(f"{source}->{target} (NO_LINK)")
            continue

        road = network.get_road(source, target)
        if road.status == RoadStatus.CLOSED:
            metrics.broken_edges.append(f"{source}->{target} (CLOSED)")

        # Vehicle-road kinematic speed resolution
        road_speed = road.free_flow_speed_kmph
        eff_speed = min(road_speed, base_vehicle_speed)

        # Vehicle-specific sensitivity to road physical attributes
        lanes = getattr(road, "lanes", 2)
        condition = getattr(road, "road_condition", "Good")

        if vehicle_type == "Lorries" and lanes == 1:
            eff_speed *= 0.85  # Heavy vehicle width constraint on single-lane roads
        elif vehicle_type in ("Bikes", "Scooters") and condition == "Bad":
            eff_speed *= 0.82  # Two-wheeler friction penalty on bad/damaged pavement

        free_time_min = (road.distance_km / max(5.0, eff_speed)) * 60.0

        actual_time = traffic_model.actual_travel_time_min(
            source, target, free_time_min, road.capacity_vehicles
        )
        congestion = traffic_model.get_congestion(source, target, road.capacity_vehicles)
        vc = traffic_model.get_vc_ratio(source, target, road.capacity_vehicles)

        metrics.distance_km += road.distance_km
        metrics.time_min += actual_time
        metrics.free_flow_time_min += free_time_min
        metrics.congestion += congestion
        total_vc += vc
        metrics.edges_used += 1

    metrics.distance_km = round(metrics.distance_km, 2)
    metrics.time_min = round(metrics.time_min, 2)
    metrics.free_flow_time_min = round(metrics.free_flow_time_min, 2)
    metrics.delay_min = round(max(0.0, metrics.time_min - metrics.free_flow_time_min), 2)
    metrics.congestion = round(metrics.congestion, 2)

    avg_vc = total_vc / max(1, metrics.edges_used)
    emissions = compute_route_emissions(
        distance_km=metrics.distance_km,
        travel_time_min=metrics.time_min,
        vehicle_type=vehicle_type,
        vc_ratio=avg_vc,
    )

    metrics.fuel_liters = emissions.fuel_liters
    metrics.co2_kg = emissions.co2_kg
    metrics.avg_speed_kmph = emissions.avg_speed_kmph
    metrics.level_of_service = emissions.level_of_service

    return metrics
