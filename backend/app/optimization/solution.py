"""
solution.py — Unified Solution Evaluation & Physics Pipeline for Route Planner (SIH26137).

Pipeline:
    Candidate Fleet Routes R = [R_1, ..., R_K]
        -> traffic_model.update_vehicle_loads(routes, vehicle_types) [PCE dynamic friction]
        -> evaluate_route() per vehicle (Time, Dist, Congestion, Fuel, CO2, Delay, LOS)
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
    Evaluates an explicit list of candidate routes for the fleet
    using PCE traffic load coupling, constraint validation, and multi-objective scoring.
    """
    # Extract vehicle types for PCE weighting
    v_types = [v.vehicle_type if hasattr(v, "vehicle_type") else "Cars" for v in vehicles]

    # Dynamic multi-vehicle traffic load coupling with PCE weights
    traffic_model.update_vehicle_loads(routes, vehicle_types=v_types)

    vehicle_solutions = []
    d_total = t_total = c_total = penalty_total = 0.0
    fuel_total = co2_total = delay_total = free_time_total = 0.0

    for vehicle, path in zip(vehicles, routes):
        v_type = vehicle.vehicle_type if hasattr(vehicle, "vehicle_type") else "Cars"
        if not path:
            metrics = RouteMetrics(path=[])
            constraint = ConstraintResult(valid=False, violations=["unreachable"], penalty=200.0)
        else:
            metrics = evaluate_route(network, traffic_model, path, vehicle_type=v_type)
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
        free_time_total += metrics.free_flow_time_min
        delay_total += metrics.delay_min
        c_total += metrics.congestion
        fuel_total += metrics.fuel_liters
        co2_total += metrics.co2_kg
        penalty_total += constraint.penalty

    # Fleet capacity oversaturation penalty
    cap_penalty, cap_violations = check_fleet_capacity_violations(network, traffic_model)
    penalty_total += cap_penalty

    # Compute aggregate Level of Service
    los_ranks = {"LOS A": 1, "LOS B": 2, "LOS C": 3, "LOS D": 4, "LOS E": 5, "LOS F (Breakdown)": 6}
    avg_los_num = sum(los_ranks.get(vs.metrics.level_of_service, 2) for vs in vehicle_solutions) / max(1, len(vehicle_solutions))
    
    if avg_los_num <= 1.5:
        avg_los = "LOS A"
    elif avg_los_num <= 2.5:
        avg_los = "LOS B"
    elif avg_los_num <= 3.5:
        avg_los = "LOS C"
    elif avg_los_num <= 4.5:
        avg_los = "LOS D"
    elif avg_los_num <= 5.5:
        avg_los = "LOS E"
    else:
        avg_los = "LOS F"

    totals = SolutionTotals(
        distance_total=round(d_total, 2),
        time_total=round(t_total, 2),
        congestion_total=round(c_total, 2),
        penalty_total=round(penalty_total, 2),
        fuel_total=round(fuel_total, 3),
        co2_total=round(co2_total, 3),
        delay_total=round(delay_total, 2),
        free_flow_time_total=round(free_time_total, 2),
        avg_los=avg_los,
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
