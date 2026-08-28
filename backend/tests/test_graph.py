"""Unit tests for RoadNetwork graph model."""

from app.simulation.graph import RoadNetwork, RoadStatus, build_demo_network, build_grid_network, build_metropolitan_network


def test_build_demo_network():
    net = build_demo_network()
    assert len(net.nodes) == 9
    assert len(net.roads) == 28  # 14 bidirectional = 28 directed
    assert net.road_exists("A", "B")
    assert net.road_exists("B", "A")


def test_road_status_toggle():
    net = build_demo_network()
    assert net.get_road("A", "B").status == RoadStatus.OPEN
    net.set_road_status("A", "B", RoadStatus.CLOSED, bidirectional=True)
    assert net.get_road("A", "B").status == RoadStatus.CLOSED
    assert net.get_road("B", "A").status == RoadStatus.CLOSED


def test_build_grid_and_metropolitan_networks():
    grid = build_grid_network()
    assert len(grid.nodes) == 16
    assert len(grid.roads) > 40

    metro = build_metropolitan_network()
    assert len(metro.nodes) == 30
    assert len(metro.roads) > 80
