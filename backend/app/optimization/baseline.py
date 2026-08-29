"""
baseline.py — Classical & Benchmark Routing Algorithms for Route Planner (SIH26137).

Provides rigorous benchmark algorithms:
1. "dijkstra": Wardrop's 1st Principle User Equilibrium (Greedy shortest travel time)
2. "astar": Euclidean-directed A* routing
3. "marginal_cost": Wardrop's 2nd Principle System Optimum (Marginal Social Cost Routing MC_e)
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
    dist_est = math.sqrt(dx * dx + dy * dy) * 0.05
    return (dist_est / max_speed_kmph) * 60.0


def dijkstra_shortest_path(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    origin: str,
    destination: str,
    use_marginal_cost: bool = False,
) -> Optional[List[str]]:
    """
    Classical Dijkstra algorithm over the road network.
    """
    if origin == destination:
        return [origin]

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

            if use_marginal_cost:
                weight = traffic_model.marginal_social_cost_min(
                    road.source, road.target, road.free_flow_time_min, road.capacity_vehicles
                )
            else:
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
    network: RoadNetwork,
    traffic_model: TrafficModel,
    origin: str,
    destination: str,
    use_marginal_cost: bool = False,
) -> Optional[List[str]]:
    """
    A* search algorithm using spatial euclidean heuristic.
    """
    if origin == destination:
        return [origin]

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

            if use_marginal_cost:
                edge_cost = traffic_model.marginal_social_cost_min(
                    road.source, road.target, road.free_flow_time_min, road.capacity_vehicles
                )
            else:
                edge_cost = traffic_model.actual_travel_time_min(
                    road.source, road.target, road.free_flow_time_min, road.capacity_vehicles
                )

            tentative_g = g_score[current] + edge_cost
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
    Runs reference routing for all vehicles.
    """
    method_lower = method.lower()
    use_marginal = "marginal" in method_lower or "so" in method_lower
    use_astar = "astar" in method_lower

    raw_paths = []
    v_types = [v.vehicle_type if hasattr(v, "vehicle_type") else "Cars" for v in vehicles]

    for vehicle in vehicles:
        if use_astar:
            path = astar_shortest_path(
                network, traffic_model, vehicle.origin, vehicle.destination, use_marginal_cost=use_marginal
            )
        else:
            path = dijkstra_shortest_path(
                network, traffic_model, vehicle.origin, vehicle.destination, use_marginal_cost=use_marginal
            )
        raw_paths.append(path)

    # Dynamic multi-vehicle traffic load coupling with PCE weights
    traffic_model.update_vehicle_loads([p for p in raw_paths if p], vehicle_types=v_types)

    results = []
    for vehicle, path in zip(vehicles, raw_paths):
        v_type = vehicle.vehicle_type if hasattr(vehicle, "vehicle_type") else "Cars"
        metrics = evaluate_route(network, traffic_model, path, vehicle_type=v_type) if path else None
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


def compute_baseline_solution_totals(results: List[BaselineResult]) -> Tuple[float, float, float, int]:
    """
    Aggregates distance, travel time, congestion, and reachable count across baseline results.
    """
    total_d = total_t = total_c = 0.0
    valid_count = 0
    for r in results:
        if r.metrics and r.path:
            total_d += r.metrics.distance_km
            total_t += r.metrics.time_min
            total_c += r.metrics.congestion
            valid_count += 1
    return round(total_d, 2), round(total_t, 2), round(total_c, 2), valid_count
