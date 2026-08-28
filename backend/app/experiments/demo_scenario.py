"""
demo_scenario.py — Route Planner's first end-to-end experiment.

Builds the demo network + vehicles + traffic, runs the classical
Dijkstra baseline AND QPSO on identical inputs, and prints a
side-by-side comparison. Also writes outputs/convergence.csv,
outputs/benchmark.json, and outputs/routes.json.

Run with:
    cd backend
    python -m app.experiments.demo_scenario
"""

from app.analysis.benchmark import run_benchmark
from app.simulation.graph import build_demo_network
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import build_demo_vehicles


def print_header(title: str) -> None:
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def main() -> None:
    network = build_demo_network()
    vehicles = build_demo_vehicles()
    traffic_model = TrafficModel(seed=42)
    traffic_model.generate(network)

    print_header("ROUTE PLANNER — BASELINE vs QPSO (SIH26137)")
    print(f"Nodes={len(network.nodes)}  Roads={len(network.roads)}  "
          f"Vehicles={len(vehicles)}")

    result = run_benchmark(
        network, traffic_model, vehicles,
        steps_per_vehicle=12, num_particles=20, num_iterations=50,
    )

    print_header("BASELINE (Dijkstra, static shortest path)")
    b = result["baseline"]
    print(f"Distance total   : {b['distance_total_km']} km")
    print(f"Time total       : {b['time_total_min']} min")
    print(f"Congestion total : {b['congestion_total']}")
    print(f"Unreachable      : {b['unreachable_vehicles']}")
    print(f"Runtime          : {b['runtime_sec']} s")

    print_header("QPSO (quantum-inspired metaheuristic)")
    q = result["qpso"]
    print(f"Distance total   : {q['distance_total_km']} km")
    print(f"Time total       : {q['time_total_min']} min")
    print(f"Congestion total : {q['congestion_total']}")
    print(f"Penalty total    : {q['penalty_total']}")
    print(f"Fitness (final)  : {q['fitness']}")
    print(f"Invalid routes   : {q['invalid_routes']}")
    print(f"Runtime          : {q['runtime_sec']} s "
          f"({q['particles']} particles x {q['iterations']} iterations)")

    print_header("COMPARISON (baseline -> QPSO)")

    def pct_change(old, new):
        if old == 0:
            return "n/a"
        return f"{((new - old) / old) * 100:+.1f}%"

    print(f"Distance   : {b['distance_total_km']} -> {q['distance_total_km']} km "
          f"({pct_change(b['distance_total_km'], q['distance_total_km'])})")
    print(f"Time       : {b['time_total_min']} -> {q['time_total_min']} min "
          f"({pct_change(b['time_total_min'], q['time_total_min'])})")
    print(f"Congestion : {b['congestion_total']} -> {q['congestion_total']} "
          f"({pct_change(b['congestion_total'], q['congestion_total'])})")

    print_header("OUTPUT FILES")
    print("outputs/convergence.csv  — best fitness per QPSO iteration")
    print("outputs/benchmark.json   — full baseline vs QPSO summary")
    print("outputs/routes.json      — every vehicle's route, both methods")


if __name__ == "__main__":
    main()
