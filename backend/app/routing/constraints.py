"""
constraints.py — Constraint handling for Route Planner.

Implements the constraints from the mathematical spec:

    1. Valid roads      — every hop in a route must be an existing edge
    2. Destination reached — the route must actually end at the vehicle's
       destination within a bounded number of steps
    3. Closed roads     — a CLOSED road cannot be used
    4. Capacity         — (hook provided; enforced once multi-vehicle
       congestion coupling is added — see docstring below)

Violations don't reject a route outright (that would make the search
space too jagged for a metaheuristic to climb out of); instead they add
a penalty P to the fitness so QPSO naturally steers away from them:

    F_final = F_objective + P
    P = lambda_1 * P_invalid + lambda_2 * P_capacity + lambda_3 * P_unreachable
"""

from dataclasses import dataclass, field
from typing import List

from app.routing.evaluator import RouteMetrics
from app.simulation.graph import RoadNetwork, RoadStatus

# Penalty weights (lambda_1, lambda_2, lambda_3 in the spec)
LAMBDA_INVALID_EDGE = 50.0
LAMBDA_CLOSED_ROAD = 50.0
LAMBDA_UNREACHABLE = 100.0


@dataclass
class ConstraintResult:
    valid: bool
    violations: List[str] = field(default_factory=list)
    penalty: float = 0.0


def check_route(
    network: RoadNetwork,
    metrics: RouteMetrics,
    origin: str,
    destination: str,
) -> ConstraintResult:
    """
    Validates a single vehicle's decoded route against the network and
    returns a penalty to add to the objective fitness.
    """
    violations: List[str] = []
    penalty = 0.0

    # Constraint 1 — valid roads
    if metrics.broken_edges:
        violations.append(
            f"invalid_edges({len(metrics.broken_edges)}): "
            f"{', '.join(metrics.broken_edges)}"
        )
        penalty += LAMBDA_INVALID_EDGE * len(metrics.broken_edges)

    # Constraint 3 — closed roads
    closed_used = []
    for source, target in zip(metrics.path[:-1], metrics.path[1:]):
        if network.road_exists(source, target):
            road = network.get_road(source, target)
            if road.status == RoadStatus.CLOSED:
                closed_used.append(f"{source}->{target}")
    if closed_used:
        violations.append(f"closed_roads_used: {', '.join(closed_used)}")
        penalty += LAMBDA_CLOSED_ROAD * len(closed_used)

    # Constraint 2 — must start at origin and end at destination
    reached = bool(metrics.path) and metrics.path[0] == origin and metrics.path[-1] == destination
    if not reached:
        violations.append(
            f"destination_not_reached (started={metrics.path[0] if metrics.path else None}, "
            f"ended={metrics.path[-1] if metrics.path else None}, target={destination})"
        )
        penalty += LAMBDA_UNREACHABLE

    valid = len(violations) == 0
    return ConstraintResult(valid=valid, violations=violations, penalty=penalty)


# --- Constraint 4 (capacity) -------------------------------------------
# Hook for the future road-utilization model described in the spec:
#     rho_e = n_e / capacity_e
# This requires knowing how many vehicles in the *current solution* use
# each road simultaneously, which means it has to be computed across all
# vehicles' routes at once, not per-route. See
# app.optimization.fitness.aggregate_solution() for where this plugs in
# once it's implemented — deliberately left as a documented gap rather
# than a fake number, per the project's "no fabricated results" rule.
def capacity_penalty_placeholder() -> float:
    return 0.0
