"""Unit tests for multi-objective fitness calculation and constraints."""

from app.optimization.fitness import Bounds, SolutionTotals, compute_fitness
from app.routing.constraints import check_route
from app.routing.evaluator import RouteMetrics
from app.simulation.graph import build_demo_network


def test_normalization_and_weights():
    t_bounds = Bounds(10.0, 50.0)
    d_bounds = Bounds(5.0, 25.0)
    c_bounds = Bounds(1.0, 10.0)

    totals = SolutionTotals(distance_total=15.0, time_total=30.0, congestion_total=5.5, penalty_total=0.0)
    weights = {"alpha": 0.5, "beta": 0.3, "gamma": 0.2}

    fitness = compute_fitness(totals, t_bounds, d_bounds, c_bounds, weights=weights)
    assert 0.0 <= fitness <= 1.0


def test_constraint_penalty():
    net = build_demo_network()
    metrics = RouteMetrics(path=["A", "C", "E", "H"], distance_km=8.4, time_min=16.0, congestion=1.5)

    # Valid route from A to H
    res_valid = check_route(net, metrics, origin="A", destination="H")
    assert res_valid.valid
    assert res_valid.penalty == 0.0

    # Unreachable destination target (target J, but path ends at H)
    res_invalid = check_route(net, metrics, origin="A", destination="J")
    assert not res_invalid.valid
    assert res_invalid.penalty > 50.0
