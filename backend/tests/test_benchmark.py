"""Unit tests for Benchmarking, Batch Repeatability, and Scalability (SIH26137)."""

import pytest
from app.analysis.benchmark import (
    calc_improvement,
    run_batch_seeds,
    run_benchmark,
    run_scalability_experiment,
)
from app.simulation.graph import build_demo_network, build_grid_network
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import build_demo_vehicles, build_fleet


def test_calc_improvement():
    # Baseline 100, QPSO 80 -> (100 - 80) / 100 * 100 = +20% (improvement)
    assert calc_improvement(100.0, 80.0) == 20.0
    # Baseline 100, QPSO 120 -> (100 - 120) / 100 * 100 = -20% (worse)
    assert calc_improvement(100.0, 120.0) == -20.0
    # Baseline 0 handled safely
    assert calc_improvement(0.0, 50.0) == 0.0


def test_run_benchmark_end_to_end():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)
    vehicles = build_demo_vehicles()

    res = run_benchmark(
        network=net,
        traffic_model=tm,
        vehicles=vehicles,
        steps_per_vehicle=12,
        num_particles=15,
        num_iterations=20,
        seed=42,
    )

    assert "baseline" in res
    assert "qpso" in res
    assert "comparison" in res
    assert "convergence" in res
    assert "routes" in res

    # Baseline and QPSO must both have non-negative fitness
    assert res["baseline"]["fitness"] >= 0.0
    assert res["qpso"]["fitness"] >= 0.0
    assert res["qpso"]["invalid_routes"] == 0
    assert res["qpso"]["valid_rate_pct"] == 100.0


def test_batch_seeds_statistical_distributions():
    seeds = [42, 123]
    batch_res = run_batch_seeds(
        network_fn=build_demo_network,
        fleet_fn=lambda net, s: build_demo_vehicles(),
        seeds=seeds,
        num_particles=10,
        num_iterations=15,
    )

    assert "statistics" in batch_res
    st = batch_res["statistics"]
    assert "mean" in st["time_improvement_pct"]
    assert "median" in st["time_improvement_pct"]
    assert "std" in st["time_improvement_pct"]
    assert "min" in st["time_improvement_pct"]
    assert "max" in st["time_improvement_pct"]


def test_scalability_experiment():
    scale_res = run_scalability_experiment(seed=42)
    assert "stages" in scale_res
    assert len(scale_res["stages"]) == 4

    # Stage 1: Demo scale
    s1 = scale_res["stages"][0]
    assert s1["stage"] == 1
    assert s1["vehicles"] == 5
    assert s1["valid_routes_rate_pct"] == 100.0

    # Stage 2: Urban Grid
    s2 = scale_res["stages"][1]
    assert s2["stage"] == 2
    assert s2["vehicles"] == 10
    assert s2["valid_routes_rate_pct"] == 100.0
