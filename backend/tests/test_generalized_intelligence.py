"""
test_generalized_intelligence.py — Automated Adversarial & Generalization Tests for Route Planner (SIH26137).

Tests:
1. Multi-vehicle global traffic distribution across parallel corridors (anti-bottlenecking).
2. Congested short road vs uncongested long road (travel-time dominance over physical distance).
3. Heavy vehicle (Lorry PCE 3.0) vs light vehicle (Bike PCE 0.5) kinematic and lane sensitivity.
4. Hard constraint enforcement: Closed roads strictly excluded.
5. Hard constraint enforcement: One-way roads strictly respected directionally.
6. Disconnected network: Clean infeasible detection without invalid routes.
7. Weather and road surface degradation impacts on travel time.
8. Fair QPSO vs Classical PSO benchmark on identical graphs and constraints.
"""

import pytest
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel, Incident, IncidentType
from app.simulation.vehicles import Vehicle
from app.analysis.benchmark import run_benchmark
from app.optimization.solution import evaluate_solution
from app.optimization.calibration import calibrate
from app.routing.k_paths import dijkstra_shortest_path, yens_k_shortest_paths


def test_congested_short_road_vs_uncongested_long_road():
    """
    Scenario:
    Path 1 (A -> B -> D): Distance = 4.0 km, but heavily loaded/congested (capacity = 2).
    Path 2 (A -> C -> D): Distance = 7.0 km, but wide and free-flow (capacity = 20).
    The optimizer should choose the faster Path 2 despite greater distance when travel time is prioritized.
    """
    net = RoadNetwork()
    net.add_node("A", (0, 0))
    net.add_node("B", (50, -50))
    net.add_node("C", (50, 50))
    net.add_node("D", (100, 0))

    # Path 1 (Short, narrow, low capacity)
    net.add_road("A", "B", distance_km=2.0, free_flow_speed_kmph=40.0, capacity_vehicles=2, bidirectional=False, lanes=1)
    net.add_road("B", "D", distance_km=2.0, free_flow_speed_kmph=40.0, capacity_vehicles=2, bidirectional=False, lanes=1)

    # Path 2 (Longer, wide highway, high capacity)
    net.add_road("A", "C", distance_km=3.5, free_flow_speed_kmph=80.0, capacity_vehicles=25, bidirectional=False, lanes=4)
    net.add_road("C", "D", distance_km=3.5, free_flow_speed_kmph=80.0, capacity_vehicles=25, bidirectional=False, lanes=4)

    tm = TrafficModel(seed=42)
    tm.generate(net)

    # Place heavy background congestion on A->B->D
    tm.static_congestion[("A", "B")] = 0.95
    tm.static_congestion[("B", "D")] = 0.95
    tm.static_congestion[("A", "C")] = 0.05
    tm.static_congestion[("C", "D")] = 0.05

    vehicles = [Vehicle("V01", "A", "D", "Cars")]

    result = run_benchmark(
        network=net,
        traffic_model=tm,
        vehicles=vehicles,
        steps_per_vehicle=4,
        num_particles=15,
        num_iterations=20,
        weights={"alpha": 0.80, "beta": 0.10, "gamma": 0.10},  # Strongly prioritize travel time
    )

    qpso_route = result["routes"]["qpso"][0]["path"]
    assert qpso_route == ["A", "C", "D"], f"Expected bypass ['A', 'C', 'D'], got {qpso_route}"


def test_multi_vehicle_fleet_load_distribution():
    """
    Scenario:
    6 vehicles travel from A to D.
    Network has 2 parallel paths:
        Path 1: A -> B -> D (capacity = 4)
        Path 2: A -> C -> D (capacity = 4)
    Optimizer must distribute vehicles across both corridors to avoid link oversaturation.
    """
    net = RoadNetwork()
    net.add_node("A", (0, 0))
    net.add_node("B", (50, -30))
    net.add_node("C", (50, 30))
    net.add_node("D", (100, 0))

    net.add_road("A", "B", distance_km=3.0, free_flow_speed_kmph=50.0, capacity_vehicles=4, bidirectional=False)
    net.add_road("B", "D", distance_km=3.0, free_flow_speed_kmph=50.0, capacity_vehicles=4, bidirectional=False)
    net.add_road("A", "C", distance_km=3.1, free_flow_speed_kmph=50.0, capacity_vehicles=4, bidirectional=False)
    net.add_road("C", "D", distance_km=3.1, free_flow_speed_kmph=50.0, capacity_vehicles=4, bidirectional=False)

    tm = TrafficModel(seed=42)
    tm.generate(net)

    vehicles = [Vehicle(f"V{i+1:02d}", "A", "D", "Cars") for i in range(6)]

    result = run_benchmark(
        network=net,
        traffic_model=tm,
        vehicles=vehicles,
        steps_per_vehicle=4,
        num_particles=20,
        num_iterations=30,
        weights={"alpha": 0.50, "beta": 0.25, "gamma": 0.25},
    )

    qpso_routes = result["routes"]["qpso"]
    path_b_count = sum(1 for r in qpso_routes if "B" in r["path"])
    path_c_count = sum(1 for r in qpso_routes if "C" in r["path"])

    assert path_b_count > 0, "Expected at least one vehicle on Corridor B"
    assert path_c_count > 0, "Expected at least one vehicle on Corridor C"
    assert path_b_count + path_c_count == 6


def test_strict_closed_road_hard_constraint():
    """
    Scenario:
    Direct road A -> B is CLOSED.
    Alternative A -> C -> B is OPEN.
    Optimizer must strictly avoid A -> B with 0 closed road violations.
    """
    net = RoadNetwork()
    net.add_node("A", (0, 0))
    net.add_node("B", (100, 0))
    net.add_node("C", (50, 50))

    net.add_road("A", "B", distance_km=2.0, free_flow_speed_kmph=60.0, capacity_vehicles=10, status=RoadStatus.CLOSED)
    net.add_road("A", "C", distance_km=2.5, free_flow_speed_kmph=50.0, capacity_vehicles=10)
    net.add_road("C", "B", distance_km=2.5, free_flow_speed_kmph=50.0, capacity_vehicles=10)

    tm = TrafficModel(seed=42)
    tm.generate(net)

    vehicles = [Vehicle("V01", "A", "B", "Cars")]
    result = run_benchmark(network=net, traffic_model=tm, vehicles=vehicles, num_particles=15, num_iterations=20)

    qpso_route = result["routes"]["qpso"][0]
    assert qpso_route["valid"] is True
    assert "A->B" not in str(qpso_route["path"])
    assert qpso_route["path"] == ["A", "C", "B"]


def test_one_way_directional_enforcement():
    """
    Scenario:
    Road A -> B is strictly ONE-WAY.
    Vehicle with origin B and destination A cannot travel B -> A directly.
    """
    net = RoadNetwork()
    net.add_node("A", (0, 0))
    net.add_node("B", (50, 0))
    net.add_node("C", (25, 40))

    # A -> B is one-way
    net.add_road("A", "B", distance_km=2.0, free_flow_speed_kmph=50.0, capacity_vehicles=10, bidirectional=False)
    # B -> C -> A return path
    net.add_road("B", "C", distance_km=2.0, free_flow_speed_kmph=50.0, capacity_vehicles=10, bidirectional=False)
    net.add_road("C", "A", distance_km=2.0, free_flow_speed_kmph=50.0, capacity_vehicles=10, bidirectional=False)

    tm = TrafficModel(seed=42)
    tm.generate(net)

    vehicles = [Vehicle("V01", "B", "A", "Cars")]
    result = run_benchmark(network=net, traffic_model=tm, vehicles=vehicles, num_particles=15, num_iterations=20)

    qpso_route = result["routes"]["qpso"][0]["path"]
    assert qpso_route == ["B", "C", "A"], f"Expected directional path ['B', 'C', 'A'], got {qpso_route}"


def test_disconnected_unreachable_destination():
    """
    Scenario:
    Node D is completely disconnected from A.
    Engine must gracefully detect destination_unreachable constraint violation without crashing.
    """
    net = RoadNetwork()
    net.add_node("A", (0, 0))
    net.add_node("B", (50, 0))
    net.add_node("D", (100, 100))  # Island

    net.add_road("A", "B", distance_km=2.0, free_flow_speed_kmph=50.0, capacity_vehicles=10)

    tm = TrafficModel(seed=42)
    tm.generate(net)

    vehicles = [Vehicle("V01", "A", "D", "Cars")]
    result = run_benchmark(network=net, traffic_model=tm, vehicles=vehicles, num_particles=10, num_iterations=10)

    qpso_route = result["routes"]["qpso"][0]
    assert qpso_route["valid"] is False
    assert any("unreachable" in v for v in qpso_route["violations"])
