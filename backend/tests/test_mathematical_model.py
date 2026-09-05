"""
test_mathematical_model.py — Unit and Integration Tests for SIH 26137 Mathematical Formulation.
"""

import pytest
from app.models.mathematical_model import (
    ConstraintViolation,
    FeasibilityResult,
    ModelWeights,
    ObjectiveBreakdown,
    TrafficRoutingModel,
)
from app.optimization.baseline import run_baseline
from app.optimization.qpso import QPSO
from app.simulation.graph import RoadNetwork, RoadStatus, build_demo_network
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle, build_demo_vehicles


@pytest.fixture
def network_and_traffic():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)
    vehicles = build_demo_vehicles()
    return net, tm, vehicles


def test_model_weights_normalization():
    w = ModelWeights(w1=2.0, w2=1.0, w3=1.0)
    assert pytest.approx(w.w1, 0.001) == 0.50
    assert pytest.approx(w.w2, 0.001) == 0.25
    assert pytest.approx(w.w3, 0.001) == 0.25
    assert pytest.approx(w.w1 + w.w2 + w.w3, 0.001) == 1.0


def test_effective_travel_time_formula(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    model = TrafficRoutingModel(net, tm, vehicles, alpha_congestion=0.20)

    road = net.get_road("A", "B")
    t0 = road.free_flow_time_min
    congestion = 0.50

    expected_tau = t0 * (1.0 + 0.20 * congestion)
    computed_tau = model.effective_travel_time("A", "B", congestion=congestion)

    assert pytest.approx(computed_tau, 0.0001) == expected_tau


def test_exact_objective_function_breakdown(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    weights = ModelWeights(w1=0.40, w2=0.30, w3=0.30)
    model = TrafficRoutingModel(net, tm, vehicles, weights=weights, alpha_congestion=0.15)

    # Routes for 5 vehicles
    routes = [
        ["A", "B", "D", "F", "J"],
        ["B", "D", "E", "G"],
        ["C", "E", "H", "J"],
        ["A", "C", "E", "H"],
        ["D", "F", "H", "J"],
    ]

    breakdown = model.objective_function(routes)
    assert isinstance(breakdown, ObjectiveBreakdown)
    assert breakdown.travel_time_total > 0.0
    assert breakdown.distance_total > 0.0
    assert breakdown.congestion_total >= 0.0
    assert breakdown.z_value > 0.0

    expected_z = (
        weights.w1 * breakdown.travel_time_total
        + weights.w2 * breakdown.distance_total
        + weights.w3 * breakdown.congestion_total
    )
    assert pytest.approx(breakdown.z_value, 0.001) == expected_z


def test_feasibility_valid_routes(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    model = TrafficRoutingModel(net, tm, vehicles)

    # Valid feasible routes matching demo vehicle origins and destinations:
    # V01: A -> H, V02: A -> J, V03: B -> H, V04: C -> J, V05: A -> G
    routes = [
        ["A", "C", "E", "H"],       # V01: A -> H
        ["A", "B", "D", "F", "J"],  # V02: A -> J
        ["B", "D", "F", "H"],       # V03: B -> H
        ["C", "E", "H", "J"],       # V04: C -> J
        ["A", "C", "E", "G"],       # V05: A -> G
    ]

    feasibility = model.is_feasible(routes)
    assert feasibility.is_feasible is True
    assert len(feasibility.violations) == 0
    assert feasibility.total_penalty == 0.0
    assert feasibility.subtour_free is True
    assert feasibility.reachability_valid is True


def test_feasibility_detects_unreachable(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    model = TrafficRoutingModel(net, tm, vehicles)

    # V1 starts at A but terminates at B instead of J
    routes = [
        ["A", "B"],
        ["B", "D", "E", "G"],
        ["C", "E", "H", "J"],
        ["A", "C", "E", "H"],
        ["D", "F", "H", "J"],
    ]

    feasibility = model.is_feasible(routes)
    assert feasibility.is_feasible is False
    assert feasibility.reachability_valid is False
    assert any(v.constraint_type == "REACHABILITY" for v in feasibility.violations)
    assert feasibility.total_penalty >= model.penalty_unreachable


def test_feasibility_detects_closed_road(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    net.set_road_status("B", "D", RoadStatus.CLOSED)
    model = TrafficRoutingModel(net, tm, vehicles)

    routes = [
        ["A", "B", "D", "F", "J"],  # Uses closed B->D
        ["B", "D", "E", "G"],
        ["C", "E", "H", "J"],
        ["A", "C", "E", "H"],
        ["D", "F", "H", "J"],
    ]

    feasibility = model.is_feasible(routes)
    assert feasibility.is_feasible is False
    assert feasibility.road_status_valid is False
    assert any(v.constraint_type == "CLOSED_ROAD" for v in feasibility.violations)


def test_feasibility_detects_mtz_subtours(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    model = TrafficRoutingModel(net, tm, vehicles)

    # Route with cycle / duplicate node: A -> B -> C -> B -> D -> F -> J
    routes = [
        ["A", "B", "C", "B", "D", "F", "J"],
        ["B", "D", "E", "G"],
        ["C", "E", "H", "J"],
        ["A", "C", "E", "H"],
        ["D", "F", "H", "J"],
    ]

    feasibility = model.is_feasible(routes)
    assert feasibility.is_feasible is False
    assert feasibility.subtour_free is False
    assert any(v.constraint_type == "MTZ_SUBTOUR" for v in feasibility.violations)


def test_qpso_with_mathematical_model_dependency(network_and_traffic):
    net, tm, vehicles = network_and_traffic
    weights = ModelWeights(w1=0.50, w2=0.25, w3=0.25)
    model = TrafficRoutingModel(net, tm, vehicles, weights=weights)

    qpso = QPSO(
        model=model,
        steps_per_vehicle=4,
        num_particles=10,
        num_iterations=15,
        seed=42,
    )
    result = qpso.run()

    assert result.gbest_fitness < float("inf")
    assert len(result.convergence) == 16
    assert result.gbest_fitness <= result.convergence[0]
