"""
evaluator.py — Route metrics evaluator for Route Planner (SIH26137).

Calculates:
    D(R) = sum of distance_km over edges in route R
    T(R) = sum of BPR actual travel times over edges in route R
    C(R) = sum of congestion indices over edges in route R
"""

from dataclasses import dataclass, field
from typing import List

from app.simulation.graph import RoadNetwork
from app.simulation.traffic import TrafficModel


@dataclass
class RouteMetrics:
    path: List[str]
    distance_km: float = 0.0
    time_min: float = 0.0
    congestion: float = 0.0
    edges_used: int = 0
    broken_edges: List[str] = field(default_factory=list)

    def __repr__(self) -> str:
        return (
            f"RouteMetrics(path={'->'.join(self.path)}, "
            f"distance={self.distance_km:.2f}km, "
            f"time={self.time_min:.2f}min, "
            f"congestion={self.congestion:.2f})"
        )


def evaluate_route(
    network: RoadNetwork, traffic_model: TrafficModel, path: List[str]
) -> RouteMetrics:
    """
    Evaluates distance, BPR travel time, and congestion along a candidate path.
    """
    metrics = RouteMetrics(path=list(path))

    if len(path) < 2:
        return metrics

    for source, target in zip(path[:-1], path[1:]):
        if not network.road_exists(source, target):
            metrics.broken_edges.append(f"{source}->{target}")
            continue

        road = network.get_road(source, target)
        actual_time = traffic_model.actual_travel_time_min(
            source, target, road.free_flow_time_min, road.capacity_vehicles
        )
        congestion = traffic_model.get_congestion(source, target, road.capacity_vehicles)

        metrics.distance_km += road.distance_km
        metrics.time_min += actual_time
        metrics.congestion += congestion
        metrics.edges_used += 1

    metrics.distance_km = round(metrics.distance_km, 2)
    metrics.time_min = round(metrics.time_min, 2)
    metrics.congestion = round(metrics.congestion, 2)

    return metrics
