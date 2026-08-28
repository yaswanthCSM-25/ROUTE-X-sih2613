# Route Planner

**SIH Problem Statement:** SIH26137 — given a transportation network and a
fleet of vehicles, find good routes while minimizing travel time,
distance, and congestion.

## Approach

Route Planner is a **simulation-based** MVP. It does not depend on any
real-world traffic API or map dataset. Instead it generates a small,
deterministic road network, a fleet of vehicles, and reproducible
road-specific traffic conditions, then evaluates and (eventually)
optimizes routes over that simulation.

The optimization engine uses a **quantum-inspired Particle Swarm
Optimization (QPSO)** algorithm, benchmarked against a classical
shortest-path baseline (Dijkstra) so that any performance claims are
measured, not assumed.

## Current development stage

**Stages 1–7 of 11 — full optimization core, working end to end.** ✅

```
backend/app/
├── simulation/
│   ├── graph.py         Road network: nodes, roads, distance, speed, capacity, status
│   ├── vehicles.py       Vehicle model: id, origin, destination
│   └── traffic.py        Deterministic, road-specific simulated congestion
├── routing/
│   ├── evaluator.py       Path -> distance / time / congestion metrics
│   └── constraints.py     Valid-road, closed-road, destination-reached checks + penalty
├── optimization/
│   ├── decoder.py          Continuous [0,1] particle -> actual graph route (priority-based encoding)
│   ├── calibration.py      Establishes fixed T/D/C normalization bounds before a run
│   ├── fitness.py          Weighted, normalized objective: F = a*T_norm + b*D_norm + g*C_norm + penalty
│   ├── baseline.py         Classical Dijkstra shortest-path routing (the reference to beat)
│   ├── solution.py         Wires decode -> evaluate -> constrain -> fitness into one callable
│   └── qpso.py              QPSO optimizer (Pbest/Gbest/mbest, quantum position update)
├── analysis/
│   └── benchmark.py         Runs baseline + QPSO on identical inputs, writes output files
└── experiments/
    └── demo_scenario.py     Entry point — run this
```

Run it:

```bash
cd backend
python -m app.experiments.demo_scenario
```

This runs the classical Dijkstra baseline and QPSO on the **same**
network / vehicles / simulated traffic, prints a side-by-side comparison,
and writes:

- `outputs/convergence.csv` — best fitness per QPSO iteration
- `outputs/benchmark.json` — full baseline vs. QPSO totals + runtime
- `outputs/routes.json` — every vehicle's actual path, both methods

### First real result (9 nodes, 14 roads, 5 vehicles, seed=42)

| Metric | Baseline (Dijkstra) | QPSO (20 particles × 50 iter) | Change |
|---|---|---|---|
| Distance total | 40.0 km | 38.6 km | **−3.5%** |
| Time total | 81.4 min | 87.2 min | +7.1% |
| Congestion total | 6.32 | 7.98 | +26.3% |
| Runtime | 0.0002 s | 0.18 s | — |

**Read honestly, not cherry-picked:** on this small scenario QPSO trades
some travel time and congestion for less total distance — it is not
uniformly "better" than the classical baseline, and this project does not
claim it is. Dijkstra optimizes each vehicle independently and exactly for
time; QPSO optimizes a weighted blend of time+distance+congestion across
all vehicles at once, so a different trade-off point is expected. This is
the honest first data point — see `outputs/benchmark.json` for the exact
numbers and `outputs/convergence.csv` to see the fitness genuinely
decrease from 0.256 → 0.047 over 50 iterations (real optimization
progress, not a fabricated curve).

Two design bugs were caught and fixed during this first run, worth
knowing about since they'll matter if the scenario is scaled up — see
inline comments in `fitness.py` and `calibration.py`:
1. Normalized fitness could go negative when QPSO beat the calibration
   sample's range — fixed by clamping to [0,1].
2. An early calibration approach used an all-zero "greedy anchor"
   particle that QPSO could trivially reproduce, collapsing fitness to
   an artificial 0 without real search happening — fixed by calibrating
   purely from random sampling plus the baseline's own (independently
   computed, not directly reachable) totals.

### What's NOT implemented yet
- **Capacity-based congestion** (`rho_e = n_e / capacity_e`, vehicles
  affecting each other's congestion) — currently congestion is a static
  per-road value, not coupled across vehicles. Hook is in
  `routing/constraints.py`.
- FastAPI backend, React frontend.
- Scaling past ~10 nodes / 5 vehicles (untested at 50/100 scale).

## Roadmap

| Stage | What we build | Status |
|---|---|---|
| 1 | Simulation engine (graph, vehicles, traffic) | ✅ Done |
| 2 | Route evaluator (distance / time / congestion per route) | ✅ Done |
| 3 | Classical baseline (Dijkstra shortest path) | ✅ Done |
| 4 | Route encoder/decoder (continuous QPSO particle → graph route) | ✅ Done |
| 5 | QPSO optimizer | ✅ Done |
| 6 | Benchmarking (QPSO vs. baseline) | ✅ Done |
| 7 | Convergence analysis | ✅ Done (convergence.csv) |
| 8 | Capacity-coupled congestion (multi-vehicle interaction) | ⏳ |
| 9 | FastAPI backend | ⏳ |
| 10 | React frontend | ⏳ |
| 11 | Scale to ~50 vehicles / ~100 roads + final demo | ⏳ |

## Project structure

```
route-planner/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── simulation/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py
│   │   │   ├── vehicles.py
│   │   │   └── traffic.py
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/        (not started)
│
└── README.md
```

## Design principles

- **No fabricated results.** Every metric the system reports is computed
  from an explicit formula over explicit inputs.
- **Baseline before claims.** QPSO is only "better" if it measurably beats
  the Dijkstra baseline on the same simulated scenario — that's an
  experimental outcome, not an assumption.
- **Small and correct before big and impressive.** The simulation and the
  route evaluator must be verified on a tiny network (9 nodes / 14 roads /
  5 vehicles) before scaling up.
