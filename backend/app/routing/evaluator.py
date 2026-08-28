"""
evaluator.py — Route evaluation for Route Planner.

Turns a raw path (list of node names) into the metrics defined in the
mathematical spec, for a single vehicle's route R_k = (v0, v1, ..., vn):

    D_k = sum of d_ij over edges in R_k      (distance, km)
    T_k = sum of t_ij (actual) over edges    (travel time, min)
    C_k = sum of c_ij over edges             (congestion)

Every number here is derived directly from the Road and TrafficModel
objects built in app.simulation — nothing is invented.
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
    broken_edges: List[str] = field(default_factory=list)  # edges in path that don't exist

    def __repr__(self) -> str:
        return (
            f"RouteMetrics(path={'->'.join(self.path)}, "
            f"distance={self.distance_km:.2f} km, "
            f"time={self.time_min:.2f} min, "
            f"congestion={self.congestion:.2f})"
        )


def evaluate_route(
    network: RoadNetwork, traffic_model: TrafficModel, path: List[str]
) -> RouteMetrics:
    """
    Walks the given path edge by edge and sums distance, actual travel
    time, and congestion. If an edge in the path does not exist in the
    network (e.g. the decoder or a corrupted particle produced an
    invalid hop), it is recorded in `broken_edges` instead of raising —
    the constraint handler is responsible for penalizing that, not the
    evaluator.
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
            source, target, road.free_flow_time_min
        )
        congestion = traffic_model.get_congestion(source, target)

        metrics.distance_km += road.distance_km
        metrics.time_min += actual_time
        metrics.congestion += congestion
        metrics.edges_used += 1

    return metrics
