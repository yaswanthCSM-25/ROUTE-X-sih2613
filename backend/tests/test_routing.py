"""Unit tests for Dijkstra and A* routing."""

from app.optimization.baseline import astar_shortest_path, dijkstra_shortest_path
from app.simulation.graph import RoadStatus, build_demo_network
from app.simulation.traffic import TrafficModel


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

    # Initial path
    initial_path = dijkstra_shortest_path(net, tm, "A", "H")
    assert "E" in initial_path and "H" in initial_path

    # Close E-H
    net.set_road_status("E", "H", RoadStatus.CLOSED, bidirectional=True)
    detour_path = dijkstra_shortest_path(net, tm, "A", "H")
    assert detour_path is not None
    assert not ("E" in detour_path and detour_path[detour_path.index("E") + 1] == "H")
