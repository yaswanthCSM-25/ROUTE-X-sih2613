"""
constraints.py — Constraint enforcement and penalty function for Route Planner (SIH26137).

Constraints:
    1. Valid Edge Transitions  — every hop in route must exist in G=(V,E)
    2. Destination Reachability — route must start at origin and reach destination
    3. Blocked / Closed Roads  — route must not traverse CLOSED road segments
    4. Cycle Avoidance          — discourages unnecessary looping paths
    5. Fleet Capacity Oversaturation — penalizes exceeding road vehicle capacities

Formulation:
    P(R) = lambda_1 * N_invalid + lambda_2 * N_closed + lambda_3 * N_unreachable + lambda_4 * N_cycles + lambda_5 * N_capacity_overflow
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple

from app.routing.evaluator import RouteMetrics
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel

# Configurable penalty coefficients for strict hard constraint enforcement
LAMBDA_INVALID_EDGE = 500.0
LAMBDA_CLOSED_ROAD = 1000.0
LAMBDA_UNREACHABLE = 2000.0
LAMBDA_CYCLE = 50.0
LAMBDA_CAPACITY_OVERFLOW = 30.0


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
    Validates a single vehicle's route and computes penalty score P(R).
    """
    violations: List[str] = []
    penalty = 0.0

    # Constraint 1 — Valid graph edges
    if metrics.broken_edges:
        violations.append(f"invalid_edges({len(metrics.broken_edges)}): {', '.join(metrics.broken_edges)}")
        penalty += LAMBDA_INVALID_EDGE * len(metrics.broken_edges)

    # Constraint 3 — Closed / blocked road segments
    closed_used = []
    for source, target in zip(metrics.path[:-1], metrics.path[1:]):
        if network.road_exists(source, target):
            road = network.get_road(source, target)
            if road.status == RoadStatus.CLOSED:
                closed_used.append(f"{source}->{target}")
    if closed_used:
        violations.append(f"closed_roads_used: {', '.join(closed_used)}")
        penalty += LAMBDA_CLOSED_ROAD * len(closed_used)

    # Constraint 2 — Origin and Destination reachability
    reached = bool(metrics.path) and metrics.path[0] == origin and metrics.path[-1] == destination
    if not reached:
        started = metrics.path[0] if metrics.path else None
        ended = metrics.path[-1] if metrics.path else None
        violations.append(f"destination_unreachable (start={started}, end={ended}, target={destination})")
        penalty += LAMBDA_UNREACHABLE

    # Constraint 4 — Cycle / loop penalty (if any node visited more than once)
    if len(metrics.path) > 1:
        unique_nodes = set(metrics.path)
        excess_hops = len(metrics.path) - len(unique_nodes)
        if excess_hops > 0:
            violations.append(f"redundant_cycles({excess_hops})")
            penalty += LAMBDA_CYCLE * excess_hops

    valid = len(violations) == 0
    return ConstraintResult(valid=valid, violations=violations, penalty=round(penalty, 2))


def check_fleet_capacity_violations(
    network: RoadNetwork,
    traffic_model: TrafficModel,
) -> Tuple[float, List[str]]:
    """
    Computes capacity oversaturation penalty across the fleet:
        P_capacity = sum_e max(0, n_e - capacity_e) * lambda_capacity
    """
    penalty = 0.0
    violations = []

    for road in network.roads:
        load = traffic_model.vehicle_counts.get((road.source, road.target), 0)
        if load > road.capacity_vehicles:
            excess = load - road.capacity_vehicles
            penalty += excess * LAMBDA_CAPACITY_OVERFLOW
            violations.append(f"capacity_overflow on {road.source}->{road.target} (load={load}/{road.capacity_vehicles})")

    return round(penalty, 2), violations
