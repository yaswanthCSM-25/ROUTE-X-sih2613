"""
main.py — Route Planner CLI & Server Entry Point (SIH26137).

Run CLI demo:
    python -m app.main

Run API server:
    python -m app.main --server
    # or: uvicorn app.api:app --host 127.0.0.1 --port 8000 --reload
"""

import sys
from app.simulation.graph import build_demo_network
from app.simulation.vehicles import build_demo_vehicles
from app.simulation.traffic import TrafficModel


def print_header(title: str) -> None:
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def run_simulation() -> None:
    network = build_demo_network()
    vehicles = build_demo_vehicles()
    traffic_model = TrafficModel(seed=42)
    traffic_model.generate(network)

    print_header("ROUTE PLANNER — SIMULATION ENGINE (SIH26137)")
    print(f"Nodes: {len(network.nodes)}  |  Roads: {len(network.roads)}  "
          f"|  Vehicles: {len(vehicles)}")

    print_header("ROAD NETWORK")
    seen = set()
    for road in network.roads:
        pair = tuple(sorted([road.source, road.target]))
        if pair in seen:
            continue
        seen.add(pair)
        print(
            f"{road.source} -> {road.target} : "
            f"{road.distance_km:.1f} km, "
            f"{road.free_flow_speed_kmph:.0f} km/h, "
            f"free_time={road.free_flow_time_min:.1f} min, "
            f"capacity={road.capacity_vehicles}, "
            f"status={road.status.value}"
        )

    print_header("VEHICLES")
    for vehicle in vehicles:
        print(vehicle)

    print_header("TRAFFIC (per road, c_ij in [0,1])")
    for road in network.roads:
        c_ij = traffic_model.get_congestion(road.source, road.target)
        t_actual = traffic_model.actual_travel_time_min(
            road.source, road.target, road.free_flow_time_min
        )
        print(
            f"{road.source} -> {road.target} : "
            f"congestion={c_ij:.2f}, "
            f"actual_time={t_actual:.1f} min "
            f"(free={road.free_flow_time_min:.1f} min)"
        )

    print_header("STATUS")
    print("Simulation & Optimization Engine OK.")
    print("To start the web application API, run: python -m app.main --server")


def start_server(host: str = "127.0.0.1", port: int = 8000) -> None:
    import uvicorn
    print(f"Starting Route Planner API server on http://{host}:{port}...")
    uvicorn.run("app.api:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ("--server", "-s", "serve"):
        start_server()
    else:
        run_simulation()
