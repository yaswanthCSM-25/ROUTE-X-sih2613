"""
benchmark.py — Benchmarking suite comparing Classical Baseline (Dijkstra/A*) vs QPSO (SIH26137).

Produces measurable, non-fabricated metrics:
    - Distance, Time, Congestion, Penalties, and Objective Fitness
    - Percentage improvements: ((baseline - qpso) / baseline) * 100
    - Multi-seed batch repeatability analysis
"""

import csv
import json
import statistics
import time
from pathlib import Path
from typing import Dict, List, Optional

from app.optimization.baseline import BaselineResult, run_baseline
from app.optimization.calibration import CalibrationBounds, calibrate
from app.optimization.qpso import QPSO
from app.optimization.solution import FullSolution, evaluate_solution
from app.simulation.graph import RoadNetwork
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


def _baseline_totals(results: List[BaselineResult]) -> dict:
    d = t = c = 0.0
    unreachable = 0
    valid_count = 0

    for r in results:
        if r.metrics is None or not r.path:
            unreachable += 1
            continue
        d += r.metrics.distance_km
        t += r.metrics.time_min
        c += r.metrics.congestion
        valid_count += 1

    return {
        "distance_total_km": round(d, 2),
        "time_total_min": round(t, 2),
        "congestion_total": round(c, 2),
        "avg_time_min": round(t / max(1, valid_count), 2),
        "avg_distance_km": round(d / max(1, valid_count), 2),
        "avg_congestion": round(c / max(1, valid_count), 3),
        "unreachable_vehicles": unreachable,
    }


def _qpso_totals(solution: FullSolution) -> dict:
    invalid = sum(1 for vs in solution.vehicle_solutions if not vs.constraint.valid)
    num_veh = len(solution.vehicle_solutions)

    return {
        "distance_total_km": round(solution.totals.distance_total, 2),
        "time_total_min": round(solution.totals.time_total, 2),
        "congestion_total": round(solution.totals.congestion_total, 2),
        "penalty_total": round(solution.totals.penalty_total, 2),
        "avg_time_min": round(solution.totals.time_total / max(1, num_veh), 2),
        "avg_distance_km": round(solution.totals.distance_total / max(1, num_veh), 2),
        "avg_congestion": round(solution.totals.congestion_total / max(1, num_veh), 3),
        "fitness": round(solution.fitness, 4),
        "invalid_routes": invalid,
        "capacity_violations": solution.capacity_violations,
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
    baseline_method: str = "dijkstra",
    output_dir: str = "outputs",
) -> dict:
    """
    Executes an end-to-end benchmark comparison between Classical Baseline and QPSO.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # 1. Classical Baseline
    t0 = time.perf_counter()
    baseline_results = run_baseline(network, vehicles, traffic_model, method=baseline_method)
    baseline_runtime = time.perf_counter() - t0
    baseline_summary = _baseline_totals(baseline_results)

    # 2. Calibration Bounds (T/D/C normalization)
    known_good = (
        baseline_summary["time_total_min"],
        baseline_summary["distance_total_km"],
        baseline_summary["congestion_total"],
    )
    bounds = calibrate(
        network, traffic_model, vehicles, steps_per_vehicle,
        known_good_totals=known_good, seed=seed,
    )

    # 3. QPSO Optimization
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

    # 4. Write Output Artifacts
    with open(out / "convergence.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["iteration", "best_fitness", "mean_fitness", "diversity"])
        for i, (b_fit, m_fit, div) in enumerate(
            zip(qpso_result.convergence, qpso_result.mean_convergence, qpso_result.diversity_history)
        ):
            writer.writerow([i, b_fit, m_fit, div])

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

    # 5. Improvement percentages: ((baseline - qpso) / baseline) * 100
    def calc_improvement(b_val: float, q_val: float) -> float:
        if b_val <= 0:
            return 0.0
        # Positive percentage means QPSO reduced the cost (better!)
        return round(((b_val - q_val) / b_val) * 100, 2)

    comparison_payload = {
        "distance_improvement_pct": calc_improvement(
            baseline_summary["distance_total_km"], qpso_summary["distance_total_km"]
        ),
        "time_improvement_pct": calc_improvement(
            baseline_summary["time_total_min"], qpso_summary["time_total_min"]
        ),
        "congestion_improvement_pct": calc_improvement(
            baseline_summary["congestion_total"], qpso_summary["congestion_total"]
        ),
        # Legacy fields for backward compatibility
        "distance_delta_pct": round(
            ((qpso_summary["distance_total_km"] - baseline_summary["distance_total_km"]) / max(0.1, baseline_summary["distance_total_km"])) * 100, 2
        ),
        "time_delta_pct": round(
            ((qpso_summary["time_total_min"] - baseline_summary["time_total_min"]) / max(0.1, baseline_summary["time_total_min"])) * 100, 2
        ),
        "congestion_delta_pct": round(
            ((qpso_summary["congestion_total"] - baseline_summary["congestion_total"]) / max(0.1, baseline_summary["congestion_total"])) * 100, 2
        ),
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
        "baseline": {**baseline_summary, "runtime_sec": round(baseline_runtime, 4), "method": baseline_method},
        "qpso": {
            **qpso_summary,
            "runtime_sec": round(qpso_runtime, 4),
            "particles": num_particles,
            "iterations": num_iterations,
        },
        "comparison": comparison_payload,
        "convergence": qpso_result.convergence,
        "mean_convergence": qpso_result.mean_convergence,
        "diversity_history": qpso_result.diversity_history,
        "routes": routes_payload,
    }
    with open(out / "benchmark.json", "w") as f:
        json.dump(benchmark_payload, f, indent=2)

    return benchmark_payload


def run_batch_seeds(
    network_fn,
    fleet_fn,
    seeds: List[int] = [42, 123, 456, 789, 1000],
    num_particles: int = 20,
    num_iterations: int = 40,
    steps_per_vehicle: int = 12,
    weights: Optional[dict] = None,
) -> dict:
    """
    Runs repeated benchmark across multiple random seeds for scientific statistical rigor.
    """
    runs = []
    for s in seeds:
        net = network_fn()
        tm = TrafficModel(seed=s)
        tm.generate(net)
        veh = fleet_fn(net, seed=s)
        res = run_benchmark(
            network=net,
            traffic_model=tm,
            vehicles=veh,
            steps_per_vehicle=steps_per_vehicle,
            num_particles=num_particles,
            num_iterations=num_iterations,
            weights=weights,
            seed=s,
        )
        runs.append({
            "seed": s,
            "baseline_time": res["baseline"]["time_total_min"],
            "qpso_time": res["qpso"]["time_total_min"],
            "time_imp_pct": res["comparison"]["time_improvement_pct"],
            "baseline_dist": res["baseline"]["distance_total_km"],
            "qpso_dist": res["qpso"]["distance_total_km"],
            "dist_imp_pct": res["comparison"]["distance_improvement_pct"],
            "qpso_fitness": res["qpso"]["fitness"],
            "runtime_sec": res["qpso"]["runtime_sec"],
        })

    avg_time_imp = statistics.mean(r["time_imp_pct"] for r in runs)
    avg_dist_imp = statistics.mean(r["dist_imp_pct"] for r in runs)
    avg_fitness = statistics.mean(r["qpso_fitness"] for r in runs)
    avg_runtime = statistics.mean(r["runtime_sec"] for r in runs)

    return {
        "seeds_tested": seeds,
        "runs": runs,
        "summary": {
            "avg_time_improvement_pct": round(avg_time_imp, 2),
            "avg_distance_improvement_pct": round(avg_dist_imp, 2),
            "avg_fitness": round(avg_fitness, 4),
            "avg_runtime_sec": round(avg_runtime, 4),
        },
    }
