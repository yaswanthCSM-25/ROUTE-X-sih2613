"""
decoder.py — Route decoder for Route Planner.

This is the bridge between QPSO (which only understands continuous
numbers) and the road network (which only understands graph edges).

Design: priority-based / random-key encoding.
----------------------------------------------
Each vehicle gets a fixed-length latent vector of values in [0, 1],
one value per decoding step:

    latent = [0.73, 0.21, 0.84, 0.55, ...]

To decode a route, we walk the graph from the vehicle's origin. At each
node we build a candidate list of reachable neighbors (excluding already
visited nodes where possible, to discourage cycles), and SORT that list
by actual travel time (cheapest first) — this is the "greedy heuristic"
ordering. The latent value for this step then picks an index into that
sorted list:

    index = floor(latent_value * num_candidates)   (clamped)
    next_node = candidates[index]

Intuition: latent_value = 0.0 always picks the cheapest neighbor (pure
greedy / exploitative). Higher latent values pick progressively worse
(more exploratory) neighbors. This gives QPSO's continuous search space
direct, interpretable control over how greedy vs. exploratory each
vehicle's route is at every step — exactly the "latent values -> route
decoder -> valid graph route" pipeline from the spec (Section 12-13).

If the vehicle cannot reach its destination within `max_steps`, decoding
stops early and the constraint handler (app.routing.constraints) applies
the "unreachable" penalty — the decoder itself never raises or silently
invents an edge.
"""

import math
from typing import List

from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel


def decode_vehicle_route(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    origin: str,
    destination: str,
    latent_vector: List[float],
) -> List[str]:
    """
    Decodes one vehicle's latent vector into a path (list of node names).
    len(latent_vector) is the max number of hops allowed (max_steps).
    """
    path = [origin]
    visited = {origin}
    current = origin

    for step in range(len(latent_vector)):
        if current == destination:
            break

        # Candidate neighbors: open roads only
        neighbors = [
            road.target
            for road in network.adjacency.get(current, [])
            if road.status == RoadStatus.OPEN
        ]
        if not neighbors:
            break  # dead end — decoding stops, constraint handler penalizes

        # Prefer unvisited neighbors to discourage cycles; if every
        # neighbor has been visited (dead end / small graph), allow
        # revisiting so the vehicle can still find a way out.
        unvisited = [n for n in neighbors if n not in visited]
        candidates = unvisited if unvisited else neighbors

        # Sort candidates by actual travel time (cheapest first) — the
        # greedy heuristic ordering the latent value indexes into.
        candidates.sort(
            key=lambda n: traffic_model.actual_travel_time_min(
                current, n, network.get_road(current, n).free_flow_time_min
            )
        )

        latent_value = max(0.0, min(0.999999, latent_vector[step]))
        index = int(math.floor(latent_value * len(candidates)))
        index = max(0, min(index, len(candidates) - 1))

        next_node = candidates[index]
        path.append(next_node)
        visited.add(next_node)
        current = next_node

    return path


def decode_all_vehicles(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List,
    particle: List[float],
    steps_per_vehicle: int,
) -> List[List[str]]:
    """
    Splits one full QPSO particle (a flat vector covering all vehicles)
    into per-vehicle latent slices and decodes each into a route.

    particle layout: [vehicle_0 latents (steps_per_vehicle) | vehicle_1 latents | ...]
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
