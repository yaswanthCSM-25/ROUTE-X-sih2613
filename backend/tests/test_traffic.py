"""Unit tests for BPR Traffic Model and dynamic incidents."""

from app.simulation.graph import RoadStatus, build_demo_network
from app.simulation.traffic import Incident, IncidentType, TrafficModel


def test_bpr_travel_time():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # Empty load
    t0 = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=6)
    assert t0 >= 3.0

    # Add load
    tm.vehicle_counts[("A", "B")] = 8  # exceeding capacity
    t_congested = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=6)
    assert t_congested > t0  # BPR effect verified


def test_incident_injection():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    assert net.get_road("E", "H").status == RoadStatus.OPEN

    incident = Incident(source="E", target="H", incident_type=IncidentType.ROAD_CLOSURE)
    tm.inject_incident(net, incident)

    assert net.get_road("E", "H").status == RoadStatus.CLOSED
    assert net.get_road("H", "E").status == RoadStatus.CLOSED
