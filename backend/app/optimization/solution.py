"""
solution.py — Ties the full pipeline together for one candidate solution:

    particle (flat [0,1] vector)
        -> decode_all_vehicles()      routes per vehicle
        -> evaluate_route() each      distance/time/congestion per vehicle
        -> check_route() each         constraint violations + penalty
        -> aggregate                  D_total, T_total, C_total, penalty_total
        -> compute_fitness()          single scalar QPSO minimizes

This is the "give the problem to QPSO" boundary: everything above this
module is routing-specific; qpso.py never imports any of it directly —
main/experiment code wires them together via a closure.
"""

from dataclasses import dataclass
from typing import List

from app.optimization.calibration import CalibrationBounds
from app.optimization.decoder import decode_all_vehicles
from app.optimization.fitness import SolutionTotals, compute_fitness
from app.routing.constraints import ConstraintResult, check_route
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


def evaluate_solution(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List[Vehicle],
    particle: List[float],
    steps_per_vehicle: int,
    bounds: CalibrationBounds,
    weights: dict = None,
) -> FullSolution:
    routes = decode_all_vehicles(
        network, traffic_model, vehicles, particle, steps_per_vehicle
    )

    vehicle_solutions = []
    d_total = t_total = c_total = penalty_total = 0.0

    for vehicle, path in zip(vehicles, routes):
        metrics = evaluate_route(network, traffic_model, path)
        constraint = check_route(network, metrics, vehicle.origin, vehicle.destination)

        vehicle_solutions.append(
            VehicleSolution(
                vehicle_id=vehicle.vehicle_id,
                path=path,
                metrics=metrics,
                constraint=constraint,
            )
        )

        d_total += metrics.distance_km
        t_total += metrics.time_min
        c_total += metrics.congestion
        penalty_total += constraint.penalty

    totals = SolutionTotals(
        distance_total=d_total,
        time_total=t_total,
        congestion_total=c_total,
        penalty_total=penalty_total,
    )
    fitness = compute_fitness(
        totals, bounds.time, bounds.distance, bounds.congestion, weights=weights
    )

    return FullSolution(vehicle_solutions=vehicle_solutions, totals=totals, fitness=fitness)

