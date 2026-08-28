"""
benchmark.py — Benchmarking suite comparing Classical Baseline (Dijkstra/A*) vs QPSO (SIH26137).

Produces rigorous, non-fabricated metrics:
    - Distance, Time, Congestion, Penalties, and Objective Fitness
    - Percentage improvements: ((baseline - qpso) / baseline) * 100
    - Multi-seed batch repeatability analysis with full statistical distributions
    - Multi-stage scalability analysis (Stages 1 through 4)
"""

import csv
import json
import math
import statistics
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

from app.optimization.baseline import BaselineResult, run_baseline
from app.optimization.calibration import CalibrationBounds, calibrate
from app.optimization.qpso import QPSO
from app.optimization.solution import FullSolution, evaluate_routes_as_solution, evaluate_solution
from app.simulation.graph import (
    RoadNetwork,
    build_demo_network,
    build_grid_network,
    build_metropolitan_network,
)
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle, build_demo_vehicles, build_fleet


@dataclass(frozen=True)
class ProblemDefinition:
    """
    Immutable problem definition guaranteeing that both Baseline and QPSO
    solve the exact same scenario instance under identical conditions.
    """
    preset: str
    network: RoadNetwork
    traffic_model: TrafficModel
    vehicles: List[Vehicle]
    weights: Dict[str, float]
    steps_per_vehicle: int = 12
    seed: int = 42


def _solution_summary(solution: FullSolution, runtime_sec: float = 0.0, method_name: str = "") -> dict:
    invalid = sum(1 for vs in solution.vehicle_solutions if not vs.constraint.valid)
    num_veh = len(solution.vehicle_solutions)

    return {
        "method": method_name,
        "distance_total_km": round(solution.totals.distance_total, 2),
        "time_total_min": round(solution.totals.time_total, 2),
        "congestion_total": round(solution.totals.congestion_total, 2),
        "penalty_total": round(solution.totals.penalty_total, 2),
        "fitness": round(solution.fitness, 4),
        "avg_time_min": round(solution.totals.time_total / max(1, num_veh), 2),
        "avg_distance_km": round(solution.totals.distance_total / max(1, num_veh), 2),
        "avg_congestion": round(solution.totals.congestion_total / max(1, num_veh), 3),
        "invalid_routes": invalid,
        "valid_rate_pct": round(((num_veh - invalid) / max(1, num_veh)) * 100, 1),
        "capacity_violations": solution.capacity_violations,
        "runtime_sec": round(runtime_sec, 4),
    }


def calc_improvement(b_val: float, q_val: float) -> float:
    """
    Computes percentage improvement:
        improvement = ((baseline - qpso) / baseline) * 100
    Positive percentage means QPSO achieved a lower (better) cost.
    Negative percentage means QPSO had a higher cost (honest reporting).
    """
    if abs(b_val) < 1e-9:
        return 0.0
    return round(((b_val - q_val) / b_val) * 100, 2)


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
    Executes an end-to-end fair benchmark comparison between Classical Baseline and QPSO.
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    w_dict = weights or {"alpha": 0.40, "beta": 0.30, "gamma": 0.30}

    # 1. Classical Baseline
    t0 = time.perf_counter()
    baseline_results = run_baseline(network, vehicles, traffic_model, method=baseline_method)
    baseline_runtime = time.perf_counter() - t0

    raw_baseline_routes = [r.path or [] for r in baseline_results]

    # Compute baseline preliminary totals for calibration anchor
    b_d = sum(r.metrics.distance_km for r in baseline_results if r.metrics)
    b_t = sum(r.metrics.time_min for r in baseline_results if r.metrics)
    b_c = sum(r.metrics.congestion for r in baseline_results if r.metrics)

    # 2. Calibration Bounds (T/D/C normalization)
    known_good = (b_t, b_d, b_c)
    bounds = calibrate(
        network,
        traffic_model,
        vehicles,
        steps_per_vehicle,
        known_good_totals=known_good,
        seed=seed,
    )

    # Evaluate Baseline as FullSolution with identical scoring & penalties
    baseline_solution = evaluate_routes_as_solution(
        network, traffic_model, vehicles, raw_baseline_routes, bounds, weights=w_dict
    )
    baseline_summary = _solution_summary(
        baseline_solution, runtime_sec=baseline_runtime, method_name=baseline_method
    )

    # 3. QPSO Optimization
    dimensions = len(vehicles) * steps_per_vehicle

    def fitness_fn(position: List[float]) -> float:
        solution = evaluate_solution(
            network, traffic_model, vehicles, position, steps_per_vehicle, bounds, weights=w_dict
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
        network,
        traffic_model,
        vehicles,
        qpso_result.gbest_position,
        steps_per_vehicle,
        bounds,
        weights=w_dict,
    )
    qpso_summary = _solution_summary(
        best_solution, runtime_sec=qpso_runtime, method_name="qpso"
    )
    qpso_summary["particles"] = num_particles
    qpso_summary["iterations"] = num_iterations

    # 4. Comparative Metrics
    comparison_payload = {
        "time_improvement_pct": calc_improvement(
            baseline_summary["time_total_min"], qpso_summary["time_total_min"]
        ),
        "distance_improvement_pct": calc_improvement(
            baseline_summary["distance_total_km"], qpso_summary["distance_total_km"]
        ),
        "congestion_improvement_pct": calc_improvement(
            baseline_summary["congestion_total"], qpso_summary["congestion_total"]
        ),
        "fitness_improvement_pct": calc_improvement(
            baseline_summary["fitness"], qpso_summary["fitness"]
        ),
        # Deltas for UI badges (negative is better for cost values)
        "time_delta_pct": round(
            ((qpso_summary["time_total_min"] - baseline_summary["time_total_min"]) / max(0.1, baseline_summary["time_total_min"])) * 100, 2
        ),
        "distance_delta_pct": round(
            ((qpso_summary["distance_total_km"] - baseline_summary["distance_total_km"]) / max(0.1, baseline_summary["distance_total_km"])) * 100, 2
        ),
        "congestion_delta_pct": round(
            ((qpso_summary["congestion_total"] - baseline_summary["congestion_total"]) / max(0.1, baseline_summary["congestion_total"])) * 100, 2
        ),
        "fitness_delta_pct": round(
            ((qpso_summary["fitness"] - baseline_summary["fitness"]) / max(0.001, baseline_summary["fitness"])) * 100, 2
        ),
    }

    # 5. Routes Payload
    routes_payload = {
        "baseline": [
            {
                "vehicle_id": vs.vehicle_id,
                "origin": vehicles[i].origin,
                "destination": vehicles[i].destination,
                "path": vs.path,
                "distance_km": round(vs.metrics.distance_km, 2),
                "time_min": round(vs.metrics.time_min, 2),
                "congestion": round(vs.metrics.congestion, 2),
                "valid": vs.constraint.valid,
                "violations": vs.constraint.violations,
            }
            for i, vs in enumerate(baseline_solution.vehicle_solutions)
        ],
        "qpso": [
            {
                "vehicle_id": vs.vehicle_id,
                "origin": vehicles[i].origin,
                "destination": vehicles[i].destination,
                "path": vs.path,
                "distance_km": round(vs.metrics.distance_km, 2),
                "time_min": round(vs.metrics.time_min, 2),
                "congestion": round(vs.metrics.congestion, 2),
                "valid": vs.constraint.valid,
                "violations": vs.constraint.violations,
            }
            for i, vs in enumerate(best_solution.vehicle_solutions)
        ],
    }

    # 6. Artifact persistence
    try:
        with open(out / "convergence.csv", "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["iteration", "best_fitness", "mean_fitness", "diversity"])
            for i, (b_fit, m_fit, div) in enumerate(
                zip(
                    qpso_result.convergence,
                    qpso_result.mean_convergence,
                    qpso_result.diversity_history,
                )
            ):
                writer.writerow([i, b_fit, m_fit, div])

        with open(out / "routes.json", "w") as f:
            json.dump(routes_payload, f, indent=2)
    except Exception:
        pass

    benchmark_payload = {
        "scenario": {
            "nodes": len(network.nodes),
            "roads": len(network.roads),
            "vehicles": len(vehicles),
        },
        "weights": w_dict,
        "calibration_bounds": {
            "time": {"min": bounds.time.min_val, "max": bounds.time.max_val},
            "distance": {"min": bounds.distance.min_val, "max": bounds.distance.max_val},
            "congestion": {"min": bounds.congestion.min_val, "max": bounds.congestion.max_val},
        },
        "baseline": baseline_summary,
        "qpso": qpso_summary,
        "comparison": comparison_payload,
        "convergence": qpso_result.convergence,
        "mean_convergence": qpso_result.mean_convergence,
        "diversity_history": qpso_result.diversity_history,
        "routes": routes_payload,
    }

    try:
        with open(out / "benchmark.json", "w") as f:
            json.dump(benchmark_payload, f, indent=2)
    except Exception:
        pass

    return benchmark_payload


def _calc_stats(values: List[float]) -> dict:
    if not values:
        return {"mean": 0.0, "median": 0.0, "std": 0.0, "min": 0.0, "max": 0.0}
    return {
        "mean": round(statistics.mean(values), 2),
        "median": round(statistics.median(values), 2),
        "std": round(statistics.stdev(values) if len(values) > 1 else 0.0, 2),
        "min": round(min(values), 2),
        "max": round(max(values), 2),
    }


def run_batch_seeds(
    network_fn: Callable[[], RoadNetwork],
    fleet_fn: Callable[[RoadNetwork, int], List[Vehicle]],
    seeds: List[int] = [42, 123, 456, 789, 1000],
    num_particles: int = 20,
    num_iterations: int = 40,
    steps_per_vehicle: int = 12,
    weights: Optional[dict] = None,
) -> dict:
    """
    Executes multi-seed statistical repeatability experiments, reporting full
    statistical distributions (mean, median, std_dev, min, max) without fabricated data.
    """
    runs = []
    time_imps = []
    dist_imps = []
    cong_imps = []
    fit_imps = []
    qpso_fitnesses = []
    runtimes = []

    for s in seeds:
        net = network_fn()
        tm = TrafficModel(seed=s)
        tm.generate(net)
        veh = fleet_fn(net, s)
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
        t_imp = res["comparison"]["time_improvement_pct"]
        d_imp = res["comparison"]["distance_improvement_pct"]
        c_imp = res["comparison"]["congestion_improvement_pct"]
        f_imp = res["comparison"]["fitness_improvement_pct"]
        fit = res["qpso"]["fitness"]
        rt = res["qpso"]["runtime_sec"]

        time_imps.append(t_imp)
        dist_imps.append(d_imp)
        cong_imps.append(c_imp)
        fit_imps.append(f_imp)
        qpso_fitnesses.append(fit)
        runtimes.append(rt)

        runs.append({
            "seed": s,
            "baseline_time": res["baseline"]["time_total_min"],
            "qpso_time": res["qpso"]["time_total_min"],
            "time_imp_pct": t_imp,
            "baseline_dist": res["baseline"]["distance_total_km"],
            "qpso_dist": res["qpso"]["distance_total_km"],
            "dist_imp_pct": d_imp,
            "baseline_congestion": res["baseline"]["congestion_total"],
            "qpso_congestion": res["qpso"]["congestion_total"],
            "congestion_imp_pct": c_imp,
            "baseline_fitness": res["baseline"]["fitness"],
            "qpso_fitness": fit,
            "fitness_imp_pct": f_imp,
            "runtime_sec": rt,
        })

    return {
        "seeds_tested": seeds,
        "runs": runs,
        "statistics": {
            "time_improvement_pct": _calc_stats(time_imps),
            "distance_improvement_pct": _calc_stats(dist_imps),
            "congestion_improvement_pct": _calc_stats(cong_imps),
            "fitness_improvement_pct": _calc_stats(fit_imps),
            "qpso_fitness": _calc_stats(qpso_fitnesses),
            "runtime_sec": _calc_stats(runtimes),
        },
        "summary": {
            "avg_time_improvement_pct": round(statistics.mean(time_imps), 2),
            "avg_distance_improvement_pct": round(statistics.mean(dist_imps), 2),
            "avg_congestion_improvement_pct": round(statistics.mean(cong_imps), 2),
            "avg_fitness": round(statistics.mean(qpso_fitnesses), 4),
            "avg_runtime_sec": round(statistics.mean(runtimes), 4),
        },
    }


def run_scalability_experiment(seed: int = 42) -> dict:
    """
    Executes standard 4-stage scalability benchmark:
        Stage 1: 5 vehicles, 9 nodes (Demo)
        Stage 2: 10 vehicles, 16 nodes (Grid)
        Stage 3: 25 vehicles, 30 nodes (Metropolitan)
        Stage 4: 50 vehicles, 30 nodes (Metropolitan stress test)
    """
    stages_config = [
        {"stage": 1, "name": "Stage 1: Demo Scale", "net_fn": build_demo_network, "veh_count": 5, "steps": 12, "particles": 15, "iterations": 20},
        {"stage": 2, "name": "Stage 2: Urban Grid Scale", "net_fn": build_grid_network, "veh_count": 10, "steps": 16, "particles": 15, "iterations": 20},
        {"stage": 3, "name": "Stage 3: Metropolitan Scale", "net_fn": build_metropolitan_network, "veh_count": 25, "steps": 22, "particles": 15, "iterations": 25},
        {"stage": 4, "name": "Stage 4: High-Density Fleet Scale", "net_fn": build_metropolitan_network, "veh_count": 50, "steps": 24, "particles": 20, "iterations": 25},
    ]

    results = []
    for cfg in stages_config:
        net = cfg["net_fn"]()
        tm = TrafficModel(seed=seed)
        tm.generate(net)
        veh = build_fleet(cfg["veh_count"], net, seed=seed)
        res = run_benchmark(
            network=net,
            traffic_model=tm,
            vehicles=veh,
            steps_per_vehicle=cfg["steps"],
            num_particles=cfg["particles"],
            num_iterations=cfg["iterations"],
            seed=seed,
        )
        results.append({
            "stage": cfg["stage"],
            "name": cfg["name"],
            "nodes": len(net.nodes),
            "roads": len(net.roads),
            "vehicles": cfg["veh_count"],
            "baseline_time_min": res["baseline"]["time_total_min"],
            "qpso_time_min": res["qpso"]["time_total_min"],
            "time_imp_pct": res["comparison"]["time_improvement_pct"],
            "baseline_dist_km": res["baseline"]["distance_total_km"],
            "qpso_dist_km": res["qpso"]["distance_total_km"],
            "dist_imp_pct": res["comparison"]["distance_improvement_pct"],
            "baseline_congestion": res["baseline"]["congestion_total"],
            "qpso_congestion": res["qpso"]["congestion_total"],
            "congestion_imp_pct": res["comparison"]["congestion_improvement_pct"],
            "baseline_fitness": res["baseline"]["fitness"],
            "qpso_fitness": res["qpso"]["fitness"],
            "fitness_imp_pct": res["comparison"]["fitness_improvement_pct"],
            "baseline_runtime_sec": res["baseline"]["runtime_sec"],
            "qpso_runtime_sec": res["qpso"]["runtime_sec"],
            "valid_routes_rate_pct": res["qpso"]["valid_rate_pct"],
        })

    return {"seed": seed, "stages": results}
