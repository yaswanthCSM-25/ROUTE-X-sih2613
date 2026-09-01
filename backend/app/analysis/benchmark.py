"""
benchmark.py — Benchmarking suite comparing Classical Baseline vs QPSO with Physics & Emissions (SIH26137).

Produces rigorous, non-fabricated metrics:
    - Distance, Travel Time, Free-Flow Time, Congestion Delay, Fuel Consumption, CO2 Emissions, LOS
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
from app.optimization.pso_classic import ClassicPSO
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
        "free_flow_time_total_min": round(solution.totals.free_flow_time_total, 2),
        "delay_total_min": round(solution.totals.delay_total, 2),
        "congestion_total": round(solution.totals.congestion_total, 2),
        "fuel_total_liters": round(solution.totals.fuel_total, 3),
        "co2_total_kg": round(solution.totals.co2_total, 3),
        "avg_los": solution.totals.avg_los,
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
    qpso_summary["convergence"] = qpso_result.convergence

    # 3b. Classical PSO Optimization (Eberhart-Kennedy Velocity-Position)
    t0_pso = time.perf_counter()
    pso_optimizer = ClassicPSO(
        dimensions=dimensions,
        num_particles=num_particles,
        num_iterations=num_iterations,
        seed=seed,
    )
    pso_gbest_pos, pso_gbest_fit, pso_conv, pso_runtime = pso_optimizer.optimize(fitness_fn)
    pso_solution = evaluate_solution(
        network,
        traffic_model,
        vehicles,
        pso_gbest_pos,
        steps_per_vehicle,
        bounds,
        weights=w_dict,
    )
    pso_summary = _solution_summary(
        pso_solution, runtime_sec=pso_runtime, method_name="pso_classic"
    )
    pso_summary["particles"] = num_particles
    pso_summary["iterations"] = num_iterations
    pso_summary["convergence"] = pso_conv

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
        "fuel_improvement_pct": calc_improvement(
            baseline_summary["fuel_total_liters"], qpso_summary["fuel_total_liters"]
        ),
        "co2_improvement_pct": calc_improvement(
            baseline_summary["co2_total_kg"], qpso_summary["co2_total_kg"]
        ),
        "delay_improvement_pct": calc_improvement(
            baseline_summary["delay_total_min"], qpso_summary["delay_total_min"]
        ),
        "fitness_improvement_pct": calc_improvement(
            baseline_summary["fitness"], qpso_summary["fitness"]
        ),
        # PSO vs QPSO Improvement
        "qpso_vs_pso_time_improvement_pct": calc_improvement(
            pso_summary["time_total_min"], qpso_summary["time_total_min"]
        ),
        "qpso_vs_pso_fitness_improvement_pct": calc_improvement(
            pso_summary["fitness"], qpso_summary["fitness"]
        ),
        # Deltas for UI badges
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
                "delay_min": round(vs.metrics.delay_min, 2),
                "congestion": round(vs.metrics.congestion, 2),
                "fuel_liters": round(vs.metrics.fuel_liters, 3),
                "co2_kg": round(vs.metrics.co2_kg, 3),
                "level_of_service": vs.metrics.level_of_service,
                "avg_speed_kmph": vs.metrics.avg_speed_kmph,
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
                "delay_min": round(vs.metrics.delay_min, 2),
                "congestion": round(vs.metrics.congestion, 2),
                "fuel_liters": round(vs.metrics.fuel_liters, 3),
                "co2_kg": round(vs.metrics.co2_kg, 3),
                "level_of_service": vs.metrics.level_of_service,
                "avg_speed_kmph": vs.metrics.avg_speed_kmph,
                "valid": vs.constraint.valid,
                "violations": vs.constraint.violations,
            }
            for i, vs in enumerate(best_solution.vehicle_solutions)
        ],
        "pso": [
            {
                "vehicle_id": vs.vehicle_id,
                "origin": vehicles[i].origin,
                "destination": vehicles[i].destination,
                "path": vs.path,
                "distance_km": round(vs.metrics.distance_km, 2),
                "time_min": round(vs.metrics.time_min, 2),
                "delay_min": round(vs.metrics.delay_min, 2),
                "congestion": round(vs.metrics.congestion, 2),
                "fuel_liters": round(vs.metrics.fuel_liters, 3),
                "co2_kg": round(vs.metrics.co2_kg, 3),
                "level_of_service": vs.metrics.level_of_service,
                "avg_speed_kmph": vs.metrics.avg_speed_kmph,
                "valid": vs.constraint.valid,
                "violations": vs.constraint.violations,
            }
            for i, vs in enumerate(pso_solution.vehicle_solutions)
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
                writer.writerow([i + 1, b_fit, m_fit, div])

        with open(out / "summary_metrics.json", "w") as f:
            json.dump(
                {
                    "baseline": baseline_summary,
                    "qpso": qpso_summary,
                    "pso": pso_summary,
                    "comparison": comparison_payload,
                },
                f,
                indent=2,
            )
    except Exception:
        pass

    return {
        "baseline": baseline_summary,
        "qpso": qpso_summary,
        "pso": pso_summary,
        "comparison": comparison_payload,
        "routes": routes_payload,
        "convergence": qpso_result.convergence,
        "diversity": qpso_result.diversity_history,
    }


def run_batch_benchmark(
    seeds: List[int],
    network: Optional[RoadNetwork] = None,
    traffic_model: Optional[TrafficModel] = None,
    vehicles: Optional[List[Vehicle]] = None,
    network_fn: Optional[Callable[[], RoadNetwork]] = None,
    fleet_fn: Optional[Callable[[RoadNetwork, int], List[Vehicle]]] = None,
    steps_per_vehicle: int = 12,
    num_particles: int = 20,
    num_iterations: int = 40,
    weights: Optional[dict] = None,
    baseline_method: str = "dijkstra",
) -> dict:
    """
    Runs multi-seed benchmarking across multiple independent runs
    and computes full statistical distribution metrics (mean, std dev, range).
    """
    runs = []

    for s in seeds:
        net = network_fn() if network_fn else network
        veh = fleet_fn(net, s) if fleet_fn else vehicles
        
        weather = traffic_model.weather if traffic_model else "Normal"
        surf = traffic_model.surface_good_pct if traffic_model else 60.0

        tm = TrafficModel(seed=s, weather=weather, surface_good_pct=surf)
        tm.generate(net)

        res = run_benchmark(
            network=net,
            traffic_model=tm,
            vehicles=veh,
            steps_per_vehicle=steps_per_vehicle,
            num_particles=num_particles,
            num_iterations=num_iterations,
            weights=weights,
            seed=s,
            baseline_method=baseline_method,
        )

        runs.append(
            {
                "seed": s,
                "baseline_time": res["baseline"]["time_total_min"],
                "qpso_time": res["qpso"]["time_total_min"],
                "time_imp_pct": res["comparison"]["time_improvement_pct"],
                "dist_imp_pct": res["comparison"]["distance_improvement_pct"],
                "congestion_imp_pct": res["comparison"]["congestion_improvement_pct"],
                "fuel_imp_pct": res["comparison"]["fuel_improvement_pct"],
                "co2_imp_pct": res["comparison"]["co2_improvement_pct"],
                "qpso_fitness": res["qpso"]["fitness"],
                "runtime_sec": res["qpso"]["runtime_sec"],
            }
        )

    def stats_for(key: str) -> dict:
        vals = [r[key] for r in runs]
        return {
            "mean": round(statistics.mean(vals), 2),
            "median": round(statistics.median(vals), 2),
            "std": round(statistics.stdev(vals), 2) if len(vals) > 1 else 0.0,
            "min": round(min(vals), 2),
            "max": round(max(vals), 2),
        }

    return {
        "seeds": seeds,
        "runs": runs,
        "statistics": {
            "time_improvement_pct": stats_for("time_imp_pct"),
            "distance_improvement_pct": stats_for("dist_imp_pct"),
            "congestion_improvement_pct": stats_for("congestion_imp_pct"),
            "fuel_improvement_pct": stats_for("fuel_imp_pct"),
            "co2_improvement_pct": stats_for("co2_imp_pct"),
            "qpso_fitness": stats_for("qpso_fitness"),
            "runtime_sec": stats_for("runtime_sec"),
        },
        "summary": {
            "avg_time_improvement_pct": round(sum(r["time_imp_pct"] for r in runs) / max(1, len(runs)), 2),
            "avg_distance_improvement_pct": round(sum(r["dist_imp_pct"] for r in runs) / max(1, len(runs)), 2),
            "avg_congestion_improvement_pct": round(sum(r["congestion_imp_pct"] for r in runs) / max(1, len(runs)), 2),
            "avg_fuel_improvement_pct": round(sum(r["fuel_imp_pct"] for r in runs) / max(1, len(runs)), 2),
            "avg_co2_improvement_pct": round(sum(r["co2_imp_pct"] for r in runs) / max(1, len(runs)), 2),
            "avg_fitness": round(sum(r["qpso_fitness"] for r in runs) / max(1, len(runs)), 4),
            "avg_runtime_sec": round(sum(r["runtime_sec"] for r in runs) / max(1, len(runs)), 2),
        },
    }


def run_scalability_benchmark(seed: int = 42) -> dict:
    """
    Executes a structured 4-stage urban scalability benchmark from small demo to metropolitan scale.
    """
    stages_config = [
        {"stage": 1, "name": "Stage 1 (Demo)", "preset": "demo", "vehicles": 5, "particles": 15, "iterations": 20},
        {"stage": 2, "name": "Stage 2 (Grid)", "preset": "smart_grid", "vehicles": 10, "particles": 15, "iterations": 25},
        {"stage": 3, "name": "Stage 3 (Metro 25)", "preset": "metropolitan", "vehicles": 25, "particles": 20, "iterations": 30},
        {"stage": 4, "name": "Stage 4 (Dense 50)", "preset": "metropolitan", "vehicles": 50, "particles": 25, "iterations": 35},
    ]

    results = []
    for cfg in stages_config:
        if cfg["preset"] == "demo":
            net = build_demo_network()
            veh = build_demo_vehicles()
        elif cfg["preset"] == "smart_grid":
            net = build_grid_network()
            veh = build_fleet(cfg["vehicles"], net, seed=seed)
        else:
            net = build_metropolitan_network()
            veh = build_fleet(cfg["vehicles"], net, seed=seed)

        tm = TrafficModel(seed=seed)
        tm.generate(net)

        res = run_benchmark(
            network=net,
            traffic_model=tm,
            vehicles=veh,
            steps_per_vehicle=4,
            num_particles=cfg["particles"],
            num_iterations=cfg["iterations"],
            seed=seed,
        )

        results.append(
            {
                "stage": cfg["stage"],
                "name": cfg["name"],
                "nodes": len(net.nodes),
                "roads": len(net.roads),
                "vehicles": cfg["vehicles"],
                "baseline_time_min": res["baseline"]["time_total_min"],
                "qpso_time_min": res["qpso"]["time_total_min"],
                "fuel_total_liters": res["qpso"]["fuel_total_liters"],
                "co2_total_kg": res["qpso"]["co2_total_kg"],
                "avg_los": res["qpso"]["avg_los"],
                "time_imp_pct": res["comparison"]["time_improvement_pct"],
                "qpso_runtime_sec": res["qpso"]["runtime_sec"],
                "valid_routes_rate_pct": res["qpso"]["valid_rate_pct"],
            }
        )

    return {
        "seed": seed,
        "stages": results,
    }


# Backward-compatible function aliases
run_batch_seeds = run_batch_benchmark
run_scalability_experiment = run_scalability_benchmark
