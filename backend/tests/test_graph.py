"""Unit tests for RoadNetwork graph model (SIH26137)."""

import pytest
from app.simulation.graph import (
    Road,
    RoadNetwork,
    RoadStatus,
    build_demo_network,
    build_grid_network,
    build_metropolitan_network,
    build_network_by_preset,
)


def test_road_attributes_and_units():
    road = Road(
        source="A",
        target="B",
        distance_km=10.0,
        free_flow_speed_kmph=60.0,
        capacity_vehicles=8,
    )
    assert road.edge_id == "A->B"
    # t_free = (10 km / 60 km/h) * 60 = 10.0 minutes
    assert pytest.approx(road.free_flow_time_min, 0.01) == 10.0
    assert road.congestion_ratio == 0.0

    # Road with speed 0 handled safely
    road_zero = Road(
        source="A", target="B", distance_km=5.0, free_flow_speed_kmph=0.0, capacity_vehicles=5
    )
    assert road_zero.free_flow_time_min == 999.0


def test_build_demo_network():
    net = build_demo_network()
    assert len(net.nodes) == 9
    assert len(net.roads) == 28  # 14 bidirectional = 28 directed
    assert net.road_exists("A", "B")
    assert net.road_exists("B", "A")
    assert net.get_road("A", "B").distance_km == 2.0
    assert "B" in net.neighbors("A")
    assert "C" in net.neighbors("A")


def test_road_status_toggle():
    net = build_demo_network()
    assert net.get_road("A", "B").status == RoadStatus.OPEN
    net.set_road_status("A", "B", RoadStatus.CLOSED, bidirectional=True)
    assert net.get_road("A", "B").status == RoadStatus.CLOSED
    assert net.get_road("B", "A").status == RoadStatus.CLOSED


def test_invalid_road_raises_error():
    net = build_demo_network()
    with pytest.raises(ValueError):
        net.get_road("A", "J")  # No direct road between A and J


def test_reset_vehicle_counts():
    net = build_demo_network()
    r = net.get_road("A", "B")
    r.current_vehicle_count = 5
    net.reset_vehicle_counts()
    assert net.get_road("A", "B").current_vehicle_count == 0


def test_build_grid_and_metropolitan_networks():
    grid = build_grid_network()
    assert len(grid.nodes) == 16
    assert len(grid.roads) == 60  # 30 bidirectional

    metro = build_metropolitan_network()
    assert len(metro.nodes) == 30
    assert len(metro.roads) == 118  # 59 bidirectional roads (49 grid + 10 express)


def test_build_network_by_preset():
    d = build_network_by_preset("demo")
    assert len(d.nodes) == 9
    g = build_network_by_preset("smart_grid")
    assert len(g.nodes) == 16
    m = build_network_by_preset("metropolitan")
    assert len(m.nodes) == 30
