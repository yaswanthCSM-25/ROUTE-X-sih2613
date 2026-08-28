"""
solution.py — Solution evaluation and aggregation pipeline for Route Planner (SIH26137).

Wires:
    particle continuous vector in [0, 1]^D
        -> decode_all_vehicles()
        -> traffic_model.update_vehicle_loads() (BPR vehicle coupling)
        -> evaluate_route() per vehicle (Time, Distance, Congestion)
        -> check_route() & check_fleet_capacity_violations()
        -> compute_fitness() with normalized multi-objective blend and penalties
"""

from dataclasses import dataclass
from typing import List, Optional

from app.optimization.calibration import CalibrationBounds
from app.optimization.decoder import decode_all_vehicles
from app.optimization.fitness import SolutionTotals, compute_fitness
from app.routing.constraints import ConstraintResult, check_fleet_capacity_violations, check_route
from app.routing.evaluator import RouteMetrics, evaluate_route
from app.simulation.graph import RoadNetwork
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


@dataclass
class VehicleSolution:
    vehicle_id: str
    path: List[str]
    metrics: RouteMetrics
    constraint: ConstraintResult


@dataclass
class FullSolution:
    vehicle_solutions: List[VehicleSolution]
    totals: SolutionTotals
    fitness: float
    capacity_violations: List[str]


def evaluate_routes_as_solution(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List[Vehicle],
    routes: List[List[str]],
    bounds: CalibrationBounds,
    weights: Optional[dict] = None,
) -> FullSolution:
    """
    Evaluates an explicit list of candidate routes for the fleet (e.g. from baseline or QPSO)
    using identical traffic load coupling, constraint validation, and multi-objective scoring.
    """
    # Dynamic multi-vehicle traffic load coupling
    traffic_model.update_vehicle_loads(routes)

    vehicle_solutions = []
    d_total = t_total = c_total = penalty_total = 0.0

    for vehicle, path in zip(vehicles, routes):
        if not path:
            metrics = RouteMetrics(path=[])
            constraint = ConstraintResult(valid=False, violations=["unreachable"], penalty=200.0)
        else:
            metrics = evaluate_route(network, traffic_model, path)
            constraint = check_route(network, metrics, vehicle.origin, vehicle.destination)

        vehicle_solutions.append(
            VehicleSolution(
                vehicle_id=vehicle.vehicle_id,
                path=path or [],
                metrics=metrics,
                constraint=constraint,
            )
        )

        d_total += metrics.distance_km
        t_total += metrics.time_min
        c_total += metrics.congestion
        penalty_total += constraint.penalty

    # Fleet capacity oversaturation penalty
    cap_penalty, cap_violations = check_fleet_capacity_violations(network, traffic_model)
    penalty_total += cap_penalty

    totals = SolutionTotals(
        distance_total=round(d_total, 2),
        time_total=round(t_total, 2),
        congestion_total=round(c_total, 2),
        penalty_total=round(penalty_total, 2),
    )

    fitness = compute_fitness(
        totals, bounds.time, bounds.distance, bounds.congestion, weights=weights
    )

    return FullSolution(
        vehicle_solutions=vehicle_solutions,
        totals=totals,
        fitness=round(fitness, 5),
        capacity_violations=cap_violations,
    )


def evaluate_solution(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List[Vehicle],
    particle: List[float],
    steps_per_vehicle: int,
    bounds: CalibrationBounds,
    weights: Optional[dict] = None,
) -> FullSolution:
    """
    Decodes and evaluates a full candidate particle representing all fleet routes.
    """
    routes = decode_all_vehicles(
        network, traffic_model, vehicles, particle, steps_per_vehicle
    )
    return evaluate_routes_as_solution(
        network, traffic_model, vehicles, routes, bounds, weights=weights
    )
