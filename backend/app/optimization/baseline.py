"""
baseline.py — Classical routing algorithms (Dijkstra and A*) for Route Planner (SIH26137).

Serves as the reference benchmark to measure QPSO optimization against.
"""

import heapq
import math
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from app.routing.evaluator import RouteMetrics, evaluate_route
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


def euclidean_heuristic(network: RoadNetwork, u: str, v: str, max_speed_kmph: float = 60.0) -> float:
    """Admissible A* heuristic estimating minimum travel time in minutes."""
    pos_u = network.node_positions.get(u)
    pos_v = network.node_positions.get(v)
    if not pos_u or not pos_v:
        return 0.0
    dx = pos_u[0] - pos_v[0]
    dy = pos_u[1] - pos_v[1]
    dist_est = math.sqrt(dx * dx + dy * dy) * 0.05  # Scale canvas units to approx km
    return (dist_est / max_speed_kmph) * 60.0


def dijkstra_shortest_path(
    network: RoadNetwork, traffic_model: TrafficModel, origin: str, destination: str
) -> Optional[List[str]]:
    """
    Classical Dijkstra algorithm over the road network with BPR travel time weights.
    Traverses only OPEN roads. Returns None if unreachable.
    """
    distances: Dict[str, float] = {origin: 0.0}
    previous: Dict[str, str] = {}
    visited = set()
    heap = [(0.0, origin)]

    while heap:
        dist, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)

        if node == destination:
            break

        for road in network.adjacency.get(node, []):
            if road.status != RoadStatus.OPEN:
                continue
            weight = traffic_model.actual_travel_time_min(
                road.source, road.target, road.free_flow_time_min, road.capacity_vehicles
            )
            new_dist = dist + weight
            if new_dist < distances.get(road.target, float("inf")):
                distances[road.target] = new_dist
                previous[road.target] = node
                heapq.heappush(heap, (new_dist, road.target))

    if destination not in distances:
        return None

    path = [destination]
    while path[-1] != origin:
        path.append(previous[path[-1]])
    path.reverse()
    return path


def astar_shortest_path(
    network: RoadNetwork, traffic_model: TrafficModel, origin: str, destination: str
) -> Optional[List[str]]:
    """
    Classical A* search algorithm using spatial euclidean heuristic.
    """
    g_score: Dict[str, float] = {origin: 0.0}
    f_score: Dict[str, float] = {origin: euclidean_heuristic(network, origin, destination)}
    previous: Dict[str, str] = {}
    visited = set()
    heap = [(f_score[origin], origin)]

    while heap:
        _, current = heapq.heappop(heap)
        if current in visited:
            continue
        visited.add(current)

        if current == destination:
            break

        for road in network.adjacency.get(current, []):
            if road.status != RoadStatus.OPEN:
                continue
            edge_time = traffic_model.actual_travel_time_min(
                road.source, road.target, road.free_flow_time_min, road.capacity_vehicles
            )
            tentative_g = g_score[current] + edge_time
            if tentative_g < g_score.get(road.target, float("inf")):
                previous[road.target] = current
                g_score[road.target] = tentative_g
                f = tentative_g + euclidean_heuristic(network, road.target, destination)
                f_score[road.target] = f
                heapq.heappush(heap, (f, road.target))

    if destination not in g_score:
        return None

    path = [destination]
    while path[-1] != origin:
        path.append(previous[path[-1]])
    path.reverse()
    return path


@dataclass
class BaselineResult:
    vehicle_id: str
    origin: str
    destination: str
    path: Optional[List[str]]
    metrics: Optional[RouteMetrics]


def run_baseline(
    network: RoadNetwork,
    vehicles: List[Vehicle],
    traffic_model: TrafficModel,
    method: str = "dijkstra",
) -> List[BaselineResult]:
    """
    Runs classical routing for all vehicles and evaluates baseline metrics.
    """
    routing_fn = astar_shortest_path if method.lower() == "astar" else dijkstra_shortest_path
    raw_paths = []

    for vehicle in vehicles:
        path = routing_fn(network, traffic_model, vehicle.origin, vehicle.destination)
        raw_paths.append(path)

    # Update traffic model with baseline vehicle routing load
    valid_paths = [p for p in raw_paths if p]
    traffic_model.update_vehicle_loads(valid_paths)

    results = []
    for vehicle, path in zip(vehicles, raw_paths):
        metrics = evaluate_route(network, traffic_model, path) if path else None
        results.append(
            BaselineResult(
                vehicle_id=vehicle.vehicle_id,
                origin=vehicle.origin,
                destination=vehicle.destination,
                path=path,
                metrics=metrics,
            )
        )
    return results
