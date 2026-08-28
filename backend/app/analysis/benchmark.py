"""
benchmark.py — Runs the classical baseline and QPSO on the same scenario
and produces a fair, side-by-side comparison. Writes:

    outputs/convergence.csv   iteration, best_fitness
    outputs/benchmark.json    baseline vs QPSO totals + runtime
    outputs/routes.json       every vehicle's route from both methods
"""

import csv
import json
import time
from dataclasses import asdict
from pathlib import Path
from typing import List, Optional

from app.optimization.baseline import BaselineResult, run_baseline
from app.optimization.calibration import CalibrationBounds, calibrate
from app.optimization.qpso import QPSO
from app.optimization.solution import FullSolution, evaluate_solution
from app.simulation.graph import RoadNetwork
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


def _baseline_totals(results: List[BaselineResult]):
    d = t = c = 0.0
    unreachable = 0
    for r in results:
        if r.metrics is None:
            unreachable += 1
            continue
        d += r.metrics.distance_km
        t += r.metrics.time_min
        c += r.metrics.congestion
    return {
        "distance_total_km": round(d, 2),
        "time_total_min": round(t, 2),
        "congestion_total": round(c, 2),
        "unreachable_vehicles": unreachable,
    }


def _qpso_totals(solution: FullSolution):
    invalid = sum(1 for vs in solution.vehicle_solutions if not vs.constraint.valid)
    return {
        "distance_total_km": round(solution.totals.distance_total, 2),
        "time_total_min": round(solution.totals.time_total, 2),
        "congestion_total": round(solution.totals.congestion_total, 2),
        "penalty_total": round(solution.totals.penalty_total, 2),
        "fitness": round(solution.fitness, 4),
        "invalid_routes": invalid,
    }


def run_benchmark(
    network: RoadNetwork,
    traffic_model: TrafficModel,
    vehicles: List[Vehicle],
    steps_per_vehicle: int = 12,
    num_particles: int = 20,
    num_iterations: int = 50,
    weights: Optional[dict] = None,
    seed: int = 42,
    output_dir: str = "outputs",
) -> dict:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # --- Baseline ---------------------------------------------------
    t0 = time.perf_counter()
    baseline_results = run_baseline(network, vehicles, traffic_model)
    baseline_runtime = time.perf_counter() - t0
    baseline_summary = _baseline_totals(baseline_results)

    # --- Calibration (fixed normalization bounds, shared by QPSO) ---
    known_good = (
        baseline_summary["time_total_min"],
        baseline_summary["distance_total_km"],
        baseline_summary["congestion_total"],
    )
    bounds = calibrate(
        network, traffic_model, vehicles, steps_per_vehicle,
        known_good_totals=known_good,
    )

    # --- QPSO ---------------------------------------------------------
    dimensions = len(vehicles) * steps_per_vehicle

    def fitness_fn(position: List[float]) -> float:
        solution = evaluate_solution(
            network, traffic_model, vehicles, position, steps_per_vehicle, bounds, weights=weights
        )
        return solution.fitness

    t0 = time.perf_counter()
    optimizer = QPSO(
        dimensions=dimensions,
        fitness_fn=fitness_fn,
        num_particles=num_particles,
        num_iterations=num_iterations,
        seed=seed,
    )
    qpso_result = optimizer.run()
    qpso_runtime = time.perf_counter() - t0

    best_solution = evaluate_solution(
        network, traffic_model, vehicles, qpso_result.gbest_position,
        steps_per_vehicle, bounds, weights=weights
    )
    qpso_summary = _qpso_totals(best_solution)

    # --- Write outputs -----------------------------------------------
    with open(out / "convergence.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["iteration", "best_fitness"])
        for i, fitness in enumerate(qpso_result.convergence):
            writer.writerow([i, round(fitness, 6)])

    routes_payload = {
        "baseline": [
            {
                "vehicle_id": r.vehicle_id,
                "origin": r.origin,
                "destination": r.destination,
                "path": r.path,
                "distance_km": round(r.metrics.distance_km, 2) if r.metrics else None,
                "time_min": round(r.metrics.time_min, 2) if r.metrics else None,
                "congestion": round(r.metrics.congestion, 2) if r.metrics else None,
            }
            for r in baseline_results
        ],
        "qpso": [
            {
                "vehicle_id": vs.vehicle_id,
                "path": vs.path,
                "distance_km": round(vs.metrics.distance_km, 2),
                "time_min": round(vs.metrics.time_min, 2),
                "congestion": round(vs.metrics.congestion, 2),
                "valid": vs.constraint.valid,
                "violations": vs.constraint.violations,
            }
            for vs in best_solution.vehicle_solutions
        ],
    }
    with open(out / "routes.json", "w") as f:
        json.dump(routes_payload, f, indent=2)

    # Percentage delta calculations
    def calc_delta(b_val, q_val):
        if b_val == 0:
            return 0.0
        return round(((q_val - b_val) / b_val) * 100, 2)

    comparison_payload = {
        "distance_delta_pct": calc_delta(baseline_summary["distance_total_km"], qpso_summary["distance_total_km"]),
        "time_delta_pct": calc_delta(baseline_summary["time_total_min"], qpso_summary["time_total_min"]),
        "congestion_delta_pct": calc_delta(baseline_summary["congestion_total"], qpso_summary["congestion_total"]),
    }

    benchmark_payload = {
        "scenario": {
            "nodes": len(network.nodes),
            "roads": len(network.roads),
            "vehicles": len(vehicles),
        },
        "weights": weights or {"alpha": 0.40, "beta": 0.30, "gamma": 0.30},
        "calibration_bounds": {
            "time": {"min": bounds.time.min_val, "max": bounds.time.max_val},
            "distance": {"min": bounds.distance.min_val, "max": bounds.distance.max_val},
            "congestion": {"min": bounds.congestion.min_val, "max": bounds.congestion.max_val},
        },
        "baseline": {**baseline_summary, "runtime_sec": round(baseline_runtime, 4)},
        "qpso": {
            **qpso_summary,
            "runtime_sec": round(qpso_runtime, 4),
            "particles": num_particles,
            "iterations": num_iterations,
        },
        "comparison": comparison_payload,
        "convergence": [round(fit, 6) for fit in qpso_result.convergence],
        "routes": routes_payload,
    }
    with open(out / "benchmark.json", "w") as f:
        json.dump(benchmark_payload, f, indent=2)

    return benchmark_payload
