"""Unit tests for BPR Traffic Model and dynamic incidents (SIH26137)."""

import pytest
from app.simulation.graph import RoadStatus, build_demo_network
from app.simulation.traffic import Incident, IncidentType, TrafficModel


def test_bpr_travel_time_formulation():
    net = build_demo_network()
    tm = TrafficModel(seed=42, alpha_bpr=0.15, beta_bpr=4.0)
    tm.generate(net)

    # Base travel time
    t0 = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=6)
    assert t0 >= 3.0

    # Add load exceeding capacity (V = 10, C = 6 -> V/C > 1.5)
    tm.vehicle_counts[("A", "B")] = 10
    t_congested = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=6)
    assert t_congested > t0

    # Capacity = 0 handled safely without division by zero
    t_safe = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=0)
    assert t_safe > 0.0


def test_traffic_congestion_index_scaling():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    c0 = tm.get_congestion("A", "B", capacity=6)
    assert 0.0 <= c0 <= 1.0

    # High vehicle count increases congestion index
    tm.vehicle_counts[("A", "B")] = 12
    c_high = tm.get_congestion("A", "B", capacity=6)
    assert c_high >= c0
    assert c_high <= 1.0


def test_update_vehicle_loads_from_routes():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    routes = [
        ["A", "B", "D", "F", "J"],
        ["A", "B", "C", "E", "H"],
        ["B", "D", "E"],
    ]
    loads = tm.update_vehicle_loads(routes)
    # Edge A->B is traversed by route 1 and route 2 -> load = 2
    assert loads.get(("A", "B")) == 2
    # Edge B->D is traversed by route 1 and route 3 -> load = 2
    assert loads.get(("B", "D")) == 2
    # Edge D->F is traversed by route 1 -> load = 1
    assert loads.get(("D", "F")) == 1


def test_incident_lifecycle():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # 1. Road closure incident
    assert net.get_road("E", "H").status == RoadStatus.OPEN
    inc_closure = Incident(source="E", target="H", incident_type=IncidentType.ROAD_CLOSURE)
    tm.inject_incident(net, inc_closure)
    assert net.get_road("E", "H").status == RoadStatus.CLOSED
    assert net.get_road("H", "E").status == RoadStatus.CLOSED

    # 2. Accident incident (capacity halving)
    cap_before = net.get_road("A", "B").capacity_vehicles
    inc_accident = Incident(source="A", target="B", incident_type=IncidentType.ACCIDENT)
    tm.inject_incident(net, inc_accident)
    assert net.get_road("A", "B").capacity_vehicles <= cap_before

    # 3. Clear incidents
    tm.clear_incidents(net)
    assert net.get_road("E", "H").status == RoadStatus.OPEN
    assert len(tm.incidents) == 0
