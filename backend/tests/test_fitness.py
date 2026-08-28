"""Unit tests for multi-objective fitness calculation and calibration (SIH26137)."""

import pytest
from app.optimization.calibration import CalibrationBounds, calibrate
from app.optimization.fitness import Bounds, SolutionTotals, compute_bounds, compute_fitness
from app.simulation.graph import build_demo_network
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import build_demo_vehicles


def test_bounds_normalization():
    b = Bounds(min_val=10.0, max_val=50.0)
    # Inside range
    assert pytest.approx(b.normalize(30.0), 0.001) == 0.5
    assert pytest.approx(b.normalize(10.0), 0.001) == 0.0
    assert pytest.approx(b.normalize(50.0), 0.001) == 1.0

    # Values beyond sample are clamped cleanly to [0, 1]
    assert b.normalize(5.0) == 0.0
    assert b.normalize(60.0) == 1.0

    # Degenerate bounds (min == max) handled safely without division by zero
    b_deg = Bounds(min_val=20.0, max_val=20.0)
    assert b_deg.normalize(20.0) == 0.0


def test_multi_objective_fitness_calculation():
    t_bounds = Bounds(10.0, 50.0)
    d_bounds = Bounds(5.0, 25.0)
    c_bounds = Bounds(1.0, 10.0)

    totals = SolutionTotals(
        distance_total=15.0,
        time_total=30.0,
        congestion_total=5.5,
        penalty_total=0.0,
    )
    weights = {"alpha": 0.40, "beta": 0.30, "gamma": 0.30}

    # t_norm = (30-10)/40 = 0.5
    # d_norm = (15-5)/20 = 0.5
    # c_norm = (5.5-1)/9 = 0.5
    # fitness = 0.4*0.5 + 0.3*0.5 + 0.3*0.5 = 0.5
    fitness = compute_fitness(totals, t_bounds, d_bounds, c_bounds, weights=weights)
    assert pytest.approx(fitness, 0.01) == 0.5


def test_fitness_penalty_addition():
    t_bounds = Bounds(10.0, 50.0)
    d_bounds = Bounds(5.0, 25.0)
    c_bounds = Bounds(1.0, 10.0)

    totals_penalty = SolutionTotals(
        distance_total=15.0,
        time_total=30.0,
        congestion_total=5.5,
        penalty_total=150.0,
    )
    fitness = compute_fitness(totals_penalty, t_bounds, d_bounds, c_bounds)
    assert fitness > 150.0  # Constraint-violating solution has heavy penalty


def test_calibration_bounds():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)
    vehicles = build_demo_vehicles()

    bounds = calibrate(
        net,
        tm,
        vehicles,
        steps_per_vehicle=12,
        sample_size=20,
        seed=42,
        known_good_totals=(40.0, 25.0, 5.0),
    )
    assert bounds.time.min_val <= bounds.time.max_val
    assert bounds.distance.min_val <= bounds.distance.max_val
    assert bounds.congestion.min_val <= bounds.congestion.max_val
