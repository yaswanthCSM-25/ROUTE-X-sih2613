"""
calibration.py — Establishes fixed T/D/C normalization bounds for Route Planner.

Establishes empirical min-max bounds (T_min/T_max, D_min/D_max, C_min/C_max)
prior to optimization by sampling random candidate solutions across the problem instance.
Bounds remain strictly fixed during optimization to maintain an invariant fitness landscape.
"""

import random
from dataclasses import dataclass
from typing import List, Optional, Tuple

from app.optimization.decoder import decode_all_vehicles
from app.optimization.fitness import Bounds, compute_bounds
from app.routing.evaluator import evaluate_route
from app.simulation.graph import RoadNetwork
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


@dataclass
class CalibrationBounds:
    time: Bounds
    distance: Bounds
    congestion: Bounds


def calibrate(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List[Vehicle],
    steps_per_vehicle: int,
    sample_size: int = 150,
    seed: int = 7,
    known_good_totals: Optional[Tuple[float, float, float]] = None,
) -> CalibrationBounds:
    """
    Samples candidate particles from the search space to compute realistic
    normalization bounds for Time, Distance, and Congestion.
    """
    rng = random.Random(seed)
    dimensions = len(vehicles) * steps_per_vehicle

    time_totals: List[float] = []
    distance_totals: List[float] = []
    congestion_totals: List[float] = []

    for _ in range(sample_size):
        particle = [rng.uniform(0.0, 1.0) for _ in range(dimensions)]
        routes = decode_all_vehicles(
            network, traffic_model, vehicles, particle, steps_per_vehicle
        )

        # Dynamic load coupling for candidate routes
        traffic_model.update_vehicle_loads(routes)

        t_total = d_total = c_total = 0.0
        for path in routes:
            metrics = evaluate_route(network, traffic_model, path)
            t_total += metrics.time_min
            d_total += metrics.distance_km
            c_total += metrics.congestion

        time_totals.append(t_total)
        distance_totals.append(d_total)
        congestion_totals.append(c_total)

    if known_good_totals is not None:
        t_known, d_known, c_known = known_good_totals
        time_totals.append(t_known)
        distance_totals.append(d_known)
        congestion_totals.append(c_known)

    # Clean up traffic model vehicle counts
    traffic_model.update_vehicle_loads([])

    return CalibrationBounds(
        time=compute_bounds(time_totals),
        distance=compute_bounds(distance_totals),
        congestion=compute_bounds(congestion_totals),
    )
