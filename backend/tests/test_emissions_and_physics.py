"""
test_emissions_and_physics.py — Tests for advanced transportation physics, emissions, and K-corridor routing.
"""

import pytest
from app.routing.k_paths import CorridorPool, dijkstra_shortest_path, yens_k_shortest_paths
from app.simulation.emissions import compute_fuel_rate_l_per_100km, compute_route_emissions
from app.simulation.graph import build_demo_network, build_grid_network
from app.simulation.traffic import TrafficModel


def test_vt_micro_fuel_and_co2_physics():
    # In heavy congestion (e.g. 10 km/h avg speed), fuel rate is high due to idling
    rate_congested = compute_fuel_rate_l_per_100km(10.0, "Cars")
    # At cruise speed (e.g. 70 km/h), fuel rate is optimal
    rate_cruising = compute_fuel_rate_l_per_100km(70.0, "Cars")
    # At very high speed (e.g. 130 km/h), aerodynamic drag increases fuel rate
    rate_highspeed = compute_fuel_rate_l_per_100km(130.0, "Cars")

    assert rate_congested > rate_cruising
    assert rate_highspeed > rate_cruising

    # Verify Lorry burns more fuel than Passenger Car
    lorry_rate = compute_fuel_rate_l_per_100km(70.0, "Lorries")
    car_rate = compute_fuel_rate_l_per_100km(70.0, "Cars")
    assert lorry_rate > car_rate * 2.0

    # Route emissions calculation
    metrics = compute_route_emissions(distance_km=10.0, travel_time_min=15.0, vehicle_type="Cars")
    assert metrics.fuel_liters > 0.0
    assert metrics.co2_kg > 0.0
    assert metrics.avg_speed_kmph == 40.0
    assert "LOS" in metrics.level_of_service


def test_pce_vehicle_load_aggregation():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # 1 Car + 1 Lorry traversing A -> B
    routes = [["A", "B", "D"], ["A", "B", "D"]]
    v_types = ["Cars", "Lorries"]
    loads = tm.update_vehicle_loads(routes, vehicle_types=v_types)

    # Car (1.0 PCE) + Lorry (2.5 PCE) = 3.5 PCE on A->B and B->D
    assert loads[("A", "B")] == 3.5
    assert loads[("B", "D")] == 3.5


def test_akcelik_and_marginal_cost_physics():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    # Under empty conditions, actual time = free flow time
    t_empty = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=6)
    assert t_empty >= 3.0

    # Under heavy oversaturation (e.g. 20 PCE on capacity 6)
    tm.vehicle_counts[("A", "B")] = 20.0
    t_congested = tm.actual_travel_time_min("A", "B", free_flow_time_min=3.0, capacity=6)
    mc_congested = tm.marginal_social_cost_min("A", "B", free_flow_time_min=3.0, capacity=6)

    # Marginal Social Cost must exceed private average travel time (Wardrop's Principle)
    assert t_congested > t_empty
    assert mc_congested > t_congested


def test_yens_k_corridors_diversity():
    net = build_demo_network()
    tm = TrafficModel(seed=42)
    tm.generate(net)

    corridors = yens_k_shortest_paths(net, tm, "A", "J", K=4)
    assert len(corridors) >= 2

    # Verify each corridor is valid and reaches J
    for p in corridors:
        assert p[0] == "A"
        assert p[-1] == "J"
        assert len(p) == len(set(p))  # Loopless

    pool = CorridorPool(net, K=4)
    cached = pool.get_corridors("A", "J", tm)
    assert len(cached) >= 2
