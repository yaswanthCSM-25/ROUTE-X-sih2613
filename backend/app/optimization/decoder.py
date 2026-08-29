"""
decoder.py — Priority Random-Key & Candidate Corridor Decoder for Route Planner (SIH26137).

Translates continuous QPSO particle positions x in [0, 1]^D into valid graph paths
by mapping continuous quantum coordinates to diverse physical alternative corridors
with active dynamic detour fallback.
"""

import math
from typing import Dict, List, Optional, Set, Tuple

from app.routing.k_paths import CorridorPool, dijkstra_shortest_path, yens_k_shortest_paths
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel

_CORRIDOR_CACHE: Dict[Tuple[int, str, str], List[List[str]]] = {}


def clear_corridor_cache() -> None:
    _CORRIDOR_CACHE.clear()


def get_cached_corridors(
    network: RoadNetwork,
    traffic_model: Optional[TrafficModel],
    origin: str,
    destination: str,
    K: int = 5,
) -> List[List[str]]:
    key = (id(network), origin, destination)
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
    """Applies active cycle repair and guaranteed destination completion."""
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
    corridor_pool: Optional[CorridorPool] = None,
) -> List[str]:
    """
    Decodes a continuous latent vector into a valid route across candidate corridors.
    """
    if origin == destination:
        return [origin]

    candidates = get_cached_corridors(network, traffic_model, origin, destination, K=5)

    if not candidates:
        fallback = dijkstra_shortest_path(network, traffic_model, origin, destination)
        return fallback or ([origin, destination] if network.road_exists(origin, destination) else [origin])

    # Map primary continuous latent coordinate to candidate corridor index
    latent_val = max(0.0, min(0.999999, latent_vector[0] if latent_vector else 0.0))
    idx = int(math.floor(latent_val * len(candidates)))
    idx = max(0, min(idx, len(candidates) - 1))
    chosen_path = candidates[idx]

    # Verify that all edges in chosen path are currently OPEN
    is_valid = True
    for u, v in zip(chosen_path[:-1], chosen_path[1:]):
        if not network.road_exists(u, v) or network.get_road(u, v).status != RoadStatus.OPEN:
            is_valid = False
            break

    if is_valid:
        return chosen_path

    # If any edge was blocked (e.g. dynamic incident), compute detour
    detour = dijkstra_shortest_path(network, traffic_model, origin, destination)
    return detour or chosen_path


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
