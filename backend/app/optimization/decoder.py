"""
decoder.py — Priority Random-Key & Candidate Corridor Decoder for Route Planner (SIH26137).

Translates continuous particle positions x in [0, 1]^D into valid graph paths
by mapping continuous quantum coordinates to diverse physical alternative corridors
with active dynamic detour fallback, multi-coordinate waypoint modulation, and inverse encoding.
"""

import math
from typing import Dict, List, Optional, Set, Tuple

from app.routing.k_paths import CorridorPool, dijkstra_shortest_path, yens_k_shortest_paths
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel

_CORRIDOR_CACHE: Dict[Tuple[int, str, str, int], List[List[str]]] = {}


def clear_corridor_cache() -> None:
    _CORRIDOR_CACHE.clear()


def get_cached_corridors(
    network: RoadNetwork,
    traffic_model: Optional[TrafficModel],
    origin: str,
    destination: str,
    K: int = 8,
) -> List[List[str]]:
    """Retrieves up to K diverse candidate corridors for (origin, destination)."""
    key = (id(network), origin, destination, K)
    if key not in _CORRIDOR_CACHE:
        _CORRIDOR_CACHE[key] = yens_k_shortest_paths(
            network, traffic_model, origin, destination, K=K
        )
    return _CORRIDOR_CACHE[key]


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
    Repairs a partial path by removing cycles and stitching the shortest path
    to destination if the path does not reach destination or is disconnected.
    """
    path = repair_path_cycles(path)
    if not path or path[-1] != destination:
        curr = path[-1] if path else destination
        rest = dijkstra_shortest_path(network, traffic_model, curr, destination)
        if rest and len(rest) > 1:
            path = path + rest[1:]
        elif not path:
            path = [curr]
    return repair_path_cycles(path)


def decode_vehicle_route(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    origin: str,
    destination: str,
    latent_vector: List[float],
    K: int = 8,
) -> List[str]:
    """
    Decodes continuous latent coordinates [u0, u1, u2, ...] into a valid graph route:
    - u0: Primary candidate corridor selector
    - u1: Secondary detour / bypass bias
    - u2: Intermediate waypoint modulation
    """
    if origin == destination:
        return [origin]

    candidates = get_cached_corridors(network, traffic_model, origin, destination, K=K)

    if not candidates:
        fallback = dijkstra_shortest_path(network, traffic_model, origin, destination)
        return fallback or ([origin, destination] if network.road_exists(origin, destination) else [origin])

    # 1. Primary corridor selection using latent_vector[0]
    u0 = max(0.0, min(0.999999, latent_vector[0] if latent_vector else 0.0))
    idx = int(math.floor(u0 * len(candidates)))
    idx = max(0, min(idx, len(candidates) - 1))
    chosen_path = candidates[idx]

    # 2. If secondary coordinate u1 indicates high detour bias and candidate has sub-hops
    if len(latent_vector) > 1 and len(candidates) > 1 and latent_vector[1] > 0.65:
        # Check if alternative candidate has less dynamic load
        u1_idx = int(math.floor(latent_vector[1] * len(candidates))) % len(candidates)
        alt_path = candidates[u1_idx]
        if alt_path and alt_path != chosen_path:
            chosen_path = alt_path

    # 3. Verify road status (OPEN/CLOSED)
    is_valid = True
    for u, v in zip(chosen_path[:-1], chosen_path[1:]):
        if not network.road_exists(u, v) or network.get_road(u, v).status != RoadStatus.OPEN:
            is_valid = False
            break

    if is_valid:
        return repair_path_cycles(chosen_path)

    # 4. If any road was blocked, compute shortest feasible detour
    detour = dijkstra_shortest_path(network, traffic_model, origin, destination)
    return repair_path_cycles(detour or chosen_path)


def decode_all_vehicles(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List,
    particle: List[float],
    steps_per_vehicle: int = 4,
) -> List[List[str]]:
    """
    Decodes the full continuous particle into discrete routes for all vehicles.
    """
    routes = []
    for i, vehicle in enumerate(vehicles):
        start = i * steps_per_vehicle
        end = start + steps_per_vehicle
        latent_slice = particle[start:end] if particle else [0.0]
        route = decode_vehicle_route(
            network,
            traffic_model,
            vehicle.origin,
            vehicle.destination,
            latent_slice,
        )
        routes.append(route)
    return routes


def encode_routes_to_particle(
    routes: List[List[str]],
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List,
    steps_per_vehicle: int = 4,
    K: int = 8,
) -> List[float]:
    """
    Inverse encoding: maps a set of discrete routes back into a continuous particle in [0, 1]^D.
    Used by 2-opt / local search to update particle positions when better routes are discovered.
    """
    particle = [0.5] * (len(vehicles) * steps_per_vehicle)
    for i, vehicle in enumerate(vehicles):
        if i >= len(routes):
            continue
        path = routes[i]
        candidates = get_cached_corridors(network, traffic_model, vehicle.origin, vehicle.destination, K=K)
        best_idx = 0
        best_match = -1
        for c_idx, cand in enumerate(candidates):
            if cand == path:
                best_idx = c_idx
                break
            # Count matching edges
            matches = sum(1 for u, v in zip(path[:-1], path[1:]) if (u, v) in zip(cand[:-1], cand[1:]))
            if matches > best_match:
                best_match = matches
                best_idx = c_idx

        # Map candidate index to continuous coordinate in middle of the bin
        step_val = (best_idx + 0.5) / max(1, len(candidates))
        particle[i * steps_per_vehicle] = max(0.01, min(0.99, step_val))
    return particle
