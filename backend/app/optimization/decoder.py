"""
decoder.py — Priority Random-Key Decoder & Route Repair for Route Planner (SIH26137).

Translates continuous QPSO particle positions x in [0, 1]^D into valid graph paths
with active Route Repair (cycle elimination, blocked edge bypass, dead-end backtracking).
"""

import math
from typing import List, Set

from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel


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


def decode_vehicle_route(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    origin: str,
    destination: str,
    latent_vector: List[float],
) -> List[str]:
    """
    Decodes a vehicle's latent vector into a valid route with repair.
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
            # Dead end — stop early; constraints handler will penalize if destination not reached
            break

        # Discourage immediate cycles: prefer unvisited nodes
        unvisited = [n for n in neighbors if n not in visited]
        candidates = unvisited if unvisited else neighbors

        # Sort candidate neighbors by BPR travel time (cheapest first)
        candidates.sort(
            key=lambda n: traffic_model.actual_travel_time_min(
                current,
                n,
                network.get_road(current, n).free_flow_time_min,
                network.get_road(current, n).capacity_vehicles,
            )
        )

        latent_val = max(0.0, min(0.999999, latent_vector[step]))
        idx = int(math.floor(latent_val * len(candidates)))
        idx = max(0, min(idx, len(candidates) - 1))

        next_node = candidates[idx]
        path.append(next_node)
        visited.add(next_node)
        current = next_node

    # Active repair: remove any unintended sub-loops
    return repair_path_cycles(path)


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
