"""
baseline.py — Classical shortest-path baseline for Route Planner.

For each vehicle independently, finds the shortest path from origin to
destination using Dijkstra's algorithm, with edge weight = actual travel
time (i.e. free-flow time adjusted by the simulated per-road congestion).

This is deliberately simple and "unfair" in one direction only: like the
QPSO run, it sees the SAME static traffic snapshot, so the comparison is
apples-to-apples. It does NOT account for vehicles interacting with each
other on shared roads (neither does the MVP QPSO yet — see the capacity
hook in app.routing.constraints). This baseline exists so we never claim
QPSO is better without measuring it against something.
"""

import heapq
from dataclasses import dataclass
from typing import Dict, List, Optional

from app.routing.evaluator import RouteMetrics, evaluate_route
from app.simulation.graph import RoadNetwork
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


def dijkstra_shortest_path(
    network: RoadNetwork, traffic_model: TrafficModel, origin: str, destination: str
) -> Optional[List[str]]:
    """
    Standard Dijkstra over the road network, edge weight = actual travel
    time in minutes (free-flow time * congestion multiplier). Only OPEN
    roads are traversable. Returns None if no path exists.
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
            if road.status.value != "OPEN":
                continue
            weight = traffic_model.actual_travel_time_min(
                road.source, road.target, road.free_flow_time_min
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


@dataclass
class BaselineResult:
    vehicle_id: str
    origin: str
    destination: str
    path: Optional[List[str]]
    metrics: Optional[RouteMetrics]


def run_baseline(
    network: RoadNetwork, vehicles: List[Vehicle], traffic_model: TrafficModel
) -> List[BaselineResult]:
    results = []
    for vehicle in vehicles:
        path = dijkstra_shortest_path(
            network, traffic_model, vehicle.origin, vehicle.destination
        )
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
