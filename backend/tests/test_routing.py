"""Unit tests for Dijkstra, A*, Decoder, Repair, and Constraints (SIH26137)."""

import pytest
from app.optimization.baseline import astar_shortest_path, dijkstra_shortest_path, run_baseline
from app.optimization.decoder import (
    decode_all_vehicles,
    decode_vehicle_route,
    repair_path_complete,
    repair_path_cycles,
)
from app.routing.constraints import check_fleet_capacity_violations, check_route
from app.routing.evaluator import RouteMetrics, evaluate_route
from app.simulation.graph import RoadStatus, build_demo_network, build_grid_network
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle, build_demo_vehicles


def test_dijkstra_routing():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    path = dijkstra_shortest_path(net, tm, "A", "H")
    assert path is not None
    assert path[0] == "A"
    assert path[-1] == "H"
    assert len(path) >= 3


def test_astar_routing():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    path = astar_shortest_path(net, tm, "A", "H")
    assert path is not None
    assert path[0] == "A"
    assert path[-1] == "H"


def test_dijkstra_blocked_road_detour():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # Initial path uses E-H
    initial_path = dijkstra_shortest_path(net, tm, "A", "H")
    assert initial_path is not None

    # Close E-H
    net.set_road_status("E", "H", RoadStatus.CLOSED, bidirectional=True)
    detour_path = dijkstra_shortest_path(net, tm, "A", "H")
    assert detour_path is not None
    assert not ("E" in detour_path and detour_path[detour_path.index("E") + 1] == "H")


def test_cycle_repair():
    # Path with loop: A -> C -> D -> B -> C -> E -> H
    looped = ["A", "C", "D", "B", "C", "E", "H"]
    repaired = repair_path_cycles(looped)
    # Truncated back to first visit of C
    assert repaired == ["A", "C", "E", "H"]


def test_decoder_guaranteed_destination_reachability():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # Decode route with random latent vector
    latent_vec = [0.1, 0.9, 0.5, 0.2, 0.8, 0.3, 0.7, 0.4]
    route = decode_vehicle_route(net, tm, "A", "J", latent_vec)
    assert route[0] == "A"
    assert route[-1] == "J"

    # Verify every consecutive pair is an existing OPEN road
    for u, v in zip(route[:-1], route[1:]):
        assert net.road_exists(u, v)
        assert net.get_road(u, v).status == RoadStatus.OPEN


def test_constraints_validation():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # Valid route
    valid_metrics = evaluate_route(net, tm, ["A", "C", "E", "H"])
    res_valid = check_route(net, valid_metrics, origin="A", destination="H")
    assert res_valid.valid
    assert res_valid.penalty == 0.0

    # Route using CLOSED road
    net.set_road_status("E", "H", RoadStatus.CLOSED, bidirectional=True)
    res_closed = check_route(net, valid_metrics, origin="A", destination="H")
    assert not res_closed.valid
    assert res_closed.penalty > 0.0

    # Capacity overflow test
    net.set_road_status("E", "H", RoadStatus.OPEN, bidirectional=True)
    tm.vehicle_counts[("A", "B")] = 20  # capacity is 6
    cap_penalty, violations = check_fleet_capacity_violations(net, tm)
    assert cap_penalty > 0.0
    assert len(violations) > 0
