"""
calibration.py — Establishes fixed T/D/C normalization bounds for Route
Planner, used by app.optimization.fitness.

Why this exists: min-max normalization needs to know the plausible range
of "total time across all vehicles" etc. *before* we can score any single
solution. We get that by decoding a batch of random particles (a rough
sample of the solution space this scenario can produce) and recording the
min/max totals seen. These bounds are then frozen for the rest of the run
— see the note in fitness.py for why they must not move mid-optimization.
"""

import random
from dataclasses import dataclass
from typing import List

from app.optimization.decoder import decode_all_vehicles
from app.optimization.fitness import Bounds, compute_bounds
from app.routing.constraints import check_route
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
    known_good_totals: "tuple | None" = None,
) -> CalibrationBounds:
    """
    known_good_totals: optional (time_total, distance_total, congestion_total)
    from a real, achievable solution — e.g. the Dijkstra baseline — to
    include when computing bounds. This is different from (and safe
    unlike) seeding calibration with a trivial particle position such as
    all-zeros: we are not handing QPSO a directly reachable point, only
    telling normalization that this objective value is achievable, which
    it genuinely is (the underlying route is reachable through *some*
    particle encoding, just not necessarily an obvious one). Without
    this, calibration bounds built from pure random sampling can be
    looser than the true achievable optimum, which collapses fitness
    resolution near the optimum (everything better than the loosest
    sampled bound clamps to the same 0.0) and removes QPSO's gradient
    exactly where it matters most.
    """
    rng = random.Random(seed)
    dimensions = len(vehicles) * steps_per_vehicle

    time_totals, distance_totals, congestion_totals = [], [], []

    # IMPORTANT: calibration samples must be drawn the same way QPSO's
    # own particles are (uniform random in [0,1]^d), and must NOT
    # include special deterministic points like all-zeros. An earlier
    # version of this function added an all-zero "greedy anchor" sample
    # to widen the bounds — but [0,0,...,0] is itself a valid, directly
    # reachable QPSO particle position. That made the calibration
    # minimum trivially achievable by QPSO just copying that exact
    # point, collapsing fitness to 0 without any real search happening.
    # Pure random sampling avoids handing the optimizer a known answer.
    for particle in [
        [rng.uniform(0.0, 1.0) for _ in range(dimensions)] for _ in range(sample_size)
    ]:
        routes = decode_all_vehicles(
            network, traffic_model, vehicles, particle, steps_per_vehicle
        )

        t_total = d_total = c_total = 0.0
        for vehicle, path in zip(vehicles, routes):
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

    return CalibrationBounds(
        time=compute_bounds(time_totals),
        distance=compute_bounds(distance_totals),
        congestion=compute_bounds(congestion_totals),
    )
