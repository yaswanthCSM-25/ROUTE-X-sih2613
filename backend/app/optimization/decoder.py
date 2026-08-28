"""
decoder.py — Priority Random-Key Decoder & Route Repair for Route Planner (SIH26137).

Translates continuous QPSO particle positions x in [0, 1]^D into valid graph paths
with active Route Repair (cycle elimination, target-guided potential heuristic, 
blocked edge bypass, and guaranteed destination completion).
"""

import heapq
import math
from typing import Dict, List, Optional, Set

from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel


def estimate_remaining_travel_time(
    network: RoadNetwork, u: str, target: str, max_speed_kmph: float = 50.0
) -> float:
    """
    Admissible spatial Euclidean heuristic estimating remaining travel time in minutes.
    """
    pos_u = network.node_positions.get(u)
    pos_t = network.node_positions.get(target)
    if not pos_u or not pos_t:
        return 0.0
    dx = pos_u[0] - pos_t[0]
    dy = pos_u[1] - pos_t[1]
    dist_km = math.sqrt(dx * dx + dy * dy) * 0.05
    return (dist_km / max(1.0, max_speed_kmph)) * 60.0


def dijkstra_detour(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    source: str,
    destination: str,
    avoid_nodes: Optional[Set[str]] = None,
) -> Optional[List[str]]:
    """
    Finds a valid detour path from source to destination traversing only OPEN edges.
    """
    distances: Dict[str, float] = {source: 0.0}
    previous: Dict[str, str] = {}
    visited = set()
    heap = [(0.0, source)]
    avoid = avoid_nodes or set()

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
            if road.target in avoid and road.target != destination:
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
        # If avoid_nodes prevented reaching destination, fallback without avoid constraint
        if avoid:
            return dijkstra_detour(network, traffic_model, source, destination, avoid_nodes=None)
        return None

    path = [destination]
    while path[-1] != source:
        path.append(previous[path[-1]])
    path.reverse()
    return path


def repair_path_cycles(path: List[str]) -> List[str]:
    """
    Removes loops/cycles from a generated path:
    e.g. ['A', 'C', 'D', 'B', 'C', 'E', 'H'] -> ['A', 'C', 'E', 'H']
    """
    if len(path) <= 2:
        return path

    repaired = []
    seen_indices = {}

    for node in path:
        if node in seen_indices:
            # Loop detected: truncate path back to previous visit of node
            cut_idx = seen_indices[node]
            repaired = repaired[: cut_idx + 1]
            seen_indices = {n: i for i, n in enumerate(repaired)}
        else:
            repaired.append(node)
            seen_indices[node] = len(repaired) - 1

    return repaired


def repair_path_complete(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    path: List[str],
    destination: str,
) -> List[str]:
    """
    Applies active cycle repair and guaranteed destination completion.
    """
    # 1. Cycle elimination
    path = repair_path_cycles(path)

    # 2. Destination completion if step budget ended before destination
    if not path or path[-1] != destination:
        curr = path[-1] if path else destination
        rest = dijkstra_detour(
            network, traffic_model, curr, destination, avoid_nodes=set(path[:-1])
        )
        if rest and len(rest) > 1:
            path = path + rest[1:]
        elif not path:
            path = [curr]

    return path


def decode_vehicle_route(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    origin: str,
    destination: str,
    latent_vector: List[float],
) -> List[str]:
    """
    Decodes a vehicle's latent vector into a valid route with target-guided ranking
    and robust destination repair.
    """
    path = [origin]
    visited: Set[str] = {origin}
    current = origin

    for step in range(len(latent_vector)):
        if current == destination:
            break

        # Filter only OPEN roads
        neighbors = [
            road.target
            for road in network.adjacency.get(current, [])
            if road.status == RoadStatus.OPEN
        ]
        if not neighbors:
            # Dead end — break to destination completion repair
            break

        # Discourage immediate cycles: prefer unvisited nodes
        unvisited = [n for n in neighbors if n not in visited]
        candidates = unvisited if unvisited else neighbors

        # Rank candidates by total estimated travel time to destination
        def candidate_score(n: str) -> float:
            road = network.get_road(current, n)
            edge_time = traffic_model.actual_travel_time_min(
                current,
                n,
                road.free_flow_time_min,
                road.capacity_vehicles,
            )
            rem_time = estimate_remaining_travel_time(network, n, destination)
            return edge_time + rem_time

        candidates.sort(key=candidate_score)

        latent_val = max(0.0, min(0.999999, latent_vector[step]))
        idx = int(math.floor(latent_val * len(candidates)))
        idx = max(0, min(idx, len(candidates) - 1))

        next_node = candidates[idx]
        path.append(next_node)
        visited.add(next_node)
        current = next_node

    # Active repair: remove loops and guarantee reaching destination
    return repair_path_complete(network, traffic_model, path, destination)


def decode_all_vehicles(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List,
    particle: List[float],
    steps_per_vehicle: int,
) -> List[List[str]]:
    """
    Decodes the full continuous particle into discrete routes for all vehicles.
    """
    routes = []
    for i, vehicle in enumerate(vehicles):
        start = i * steps_per_vehicle
        end = start + steps_per_vehicle
        latent_slice = particle[start:end]
        route = decode_vehicle_route(
            network, traffic_model, vehicle.origin, vehicle.destination, latent_slice
        )
        routes.append(route)
    return routes
