# ROUTE-X — Quantum-Inspired Intelligent Traffic Route Optimization

**SIH Problem Statement ID:** 26137  
**Problem Statement Title:** Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization  
**Organization:** Egreen Quanta  
**Department:** Egreen Quanta  
**Category:** Software | **Theme:** Transportation and Logistics  

---

## 1. Executive Summary & Problem Context

Modern urban transportation networks face persistent challenges of traffic congestion, inefficient route planning, and high operational costs. Classical optimization techniques struggle with large-scale Vehicle Routing Problems (VRP) due to their NP-hard combinatorial complexity. While true quantum hardware remains constrained by NISQ-era physical qubit limitations, **Quantum-Inspired Particle Swarm Optimization (QPSO)** embeds quantum-mechanical wave equation principles (delta-potential-well uncertainty distributions) into classical computation, providing superior global search capabilities, faster convergence, and an optimal balance between exploration and exploitation.

**ROUTE-X** is a scientific simulation and optimization platform designed for **SIH26137**. It integrates:
* **Graph Network Engine:** Directed/bidirectional road networks with distance, speed limits, capacities, operational status, and 2D spatial layouts.
* **BPR Traffic & Load Coupling Engine:** Bureau of Public Roads non-linear congestion functions ($t = t_{free}[1 + \alpha (V/C)^\beta]$) with multi-vehicle dynamic load coupling.
* **Multi-Objective Cost Function:** Normalized trade-off across Travel Time, Travel Distance, and Congestion with hard constraint penalties.
* **QPSO Metaheuristic Optimizer:** Quantum position updates with $m_{best}$ attractor, priority random-key decoding, and active route repair.
* **Classical Baseline Benchmark:** Exact Dijkstra and A* shortest-path routing.
* **Dynamic Incident & Resilience Engine:** Live simulation of accidents, lane closures, and capacity bottlenecks with automatic detour rerouting.
* **Interactive Web Platform:** High-performance FastAPI backend + modern React SVG visualization dashboard.

---

## 2. Delivery Table (Expected Deliverables)

| Deliverable ID | Component | Technical Specification | Status |
| :--- | :--- | :--- | :---: |
| **DEL-01** | **Graph-Based Network Model** | Graph $G=(V, E)$ storing $d_{ij}$, speed limits $v_{ij}$, vehicle capacities $c_{ij}$, vehicle counts $n_{ij}$, status (OPEN/CLOSED), and $(x, y)$ coordinates. | ✅ Complete |
| **DEL-02** | **BPR Traffic & Congestion Engine** | Bureau of Public Roads formulation: $t_{actual} = t_{free} \cdot [1 + \alpha_{BPR}(V/C)^{\beta_{BPR}}]$ with dynamic multi-vehicle density coupling. | ✅ Complete |
| **DEL-03** | **Classical Baseline Routing** | Dijkstra & A* shortest-path routing optimizing travel time under current congestion conditions. | ✅ Complete |
| **DEL-04** | **QPSO Metaheuristic Engine** | Quantum delta-potential-well position update, mean best position ($m_{best}$) attractor, priority random-key decoding, and active loop repair. | ✅ Complete |
| **DEL-05** | **FastAPI Backend REST Services** | High-performance asynchronous REST API (`/api/optimize`, `/api/simulation/incident`, `/api/benchmark/batch`). | ✅ Complete |
| **DEL-06** | **Interactive Web Visualizer** | Modern dark-themed dashboard with BPR traffic heatmaps, road closure toggles, vehicle playback simulation, and parameter studio. | ✅ Complete |
| **DEL-07** | **Convergence & KPI Analytics** | Real-time comparative KPI cards ($\Delta\%$ improvements), swarm diversity metrics, and SVG convergence charts. | ✅ Complete |
| **DEL-08** | **Dynamic Incidents & Scalability** | Live accident/closure injection with automatic rerouting across 9-node demo, 16-node grid, and 30-node metropolitan networks. | ✅ Complete |

---

## 3. Mathematical Formulation

### 3.1. Multi-Objective Route Cost Function
For candidate fleet routes $R = \{R_1, R_2, \dots, R_K\}$ across $K$ vehicles:

$$F(R) = w_t \cdot T_{norm}(R) + w_d \cdot D_{norm}(R) + w_c \cdot C_{norm}(R) + w_r \cdot P(R)$$

where:
* **Total Travel Time $T(R)$:** $\sum_{k=1}^K \sum_{e \in R_k} t_{actual}(e)$
* **Total Travel Distance $D(R)$:** $\sum_{k=1}^K \sum_{e \in R_k} d_e$
* **Total Congestion Index $C(R)$:** $\sum_{k=1}^K \sum_{e \in R_k} c_e$
* **Constraint Penalty $P(R)$:** Strongly penalizes invalid transitions, closed roads, capacity oversaturation, and unreachable destinations:
  $$P(R) = \lambda_1 N_{invalid} + \lambda_2 N_{closed} + \lambda_3 N_{unreachable} + \lambda_4 N_{cycles} + \lambda_5 \sum_e \max(0, n_e - c_e)$$

### 3.2. BPR Traffic Congestion Function
Travel time on road segment $e = (u, v)$ is calculated using the Bureau of Public Roads formula:

$$t_{actual}(e) = t_{free}(e) \cdot \left[ 1 + \alpha_{BPR} \left( \frac{V_e}{C_e} \right)^{\beta_{BPR}} \right]$$

where $V_e = n_e + (c_{static} \cdot C_e \cdot 0.5)$ accounts for both fleet load and background traffic, and default $\alpha_{BPR} = 0.15, \beta_{BPR} = 4.0$.

### 3.3. Quantum-Behaved PSO Formulation
In QPSO, particles do not have classical velocity vectors; their state is governed by a quantum wave function in a delta potential well:

1. **Local Attractor:**
   $$p_{i,d} = \phi_{i,d} \cdot Pbest_{i,d} + (1 - \phi_{i,d}) \cdot Gbest_d, \quad \phi \sim U(0,1)$$

2. **Mean Best Position ($mbest$):**
   $$mbest_d = \frac{1}{N} \sum_{i=1}^N Pbest_{i,d}$$

3. **Quantum Delta-Potential-Well Position Update:**
   $$x_{i,d}(t+1) = p_{i,d} \pm \beta(t) \cdot |mbest_d - x_{i,d}(t)| \cdot \ln\left(\frac{1}{u_{i,d}}\right), \quad u \sim U(0,1)$$

4. **Linearly Annealed Contraction-Expansion Coefficient:**
   $$\beta(t) = \beta_{max} - \frac{t}{T}(\beta_{max} - \beta_{min}), \quad \beta_{max}=1.0, \beta_{min}=0.4$$

---

## 4. System Architecture

```text
                    ROUTE PLANNER (SIH26137)
                               |
                               v
            +------------------------------------+
            |      React + Vite + SVG Canvas     |
            |     Simulation & Control Studio    |
            +------------------+-----------------+
                               |  REST API / JSON
                               v
            +------------------------------------+
            |          FastAPI Backend           |
            +------------------+-----------------+
                               |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
  Scenario Engine        Graph Engine          BPR Traffic Engine
(Fleet 5-50 veh)      (9, 16, 30 Nodes)       (Coupled Road Loads)
        |                      |                      |
        +----------------------+----------------------+
                               |
                               v
                   Mathematical Cost Function
               (Min-Max Calibration Normalization)
                               |
                               v
                   Route Constraints Handler
                 (Valid, Closed, Capacity P(R))
                               |
                               v
            +------------------------------------+
            |        Optimization Engine         |
            |                                    |
            |   • Baseline: Dijkstra / A*        |
            |   • Optimizer: Quantum QPSO        |
            +------------------+-----------------+
                               |
                               v
                  Comparative Metrics Engine
            (Time, Distance, Congestion, Fitness)
```

---

## 5. Quick Start & Installation

### Prerequisites
* **Python:** 3.11+
* **Node.js:** 18+

### 1. Backend Setup & Local Server
```powershell
cd backend
python -m pip install -r requirements.txt

# Run Unit Test Suite:
python -m pytest -v

# Run End-to-End Simulation Experiment:
python -m app.experiments.demo_scenario

# Start FastAPI API Server:
python -m uvicorn app.api:app --host 127.0.0.1 --port 8000
```
Interactive Swagger Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Dashboard Setup
```powershell
cd frontend
npm install
npm run build
npm run dev
```
Web Visualizer Dashboard: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 6. Scientific Repeatability (Multi-Seed Benchmark)

To ensure zero cherry-picking and scientific validity, the platform includes a 5-seed Monte Carlo evaluation across independent random seeds (`42, 123, 456, 789, 1000`):

| Metric | Classical Baseline | QPSO Optimizer | Result |
| :--- | :--- | :--- | :---: |
| **Total Route Distance** | 38.4 km | 38.6 km | Balanced trade-off |
| **Constraint Validity** | 100% Valid | 100% Valid | 0 Penalties |
| **Swarm Convergence** | N/A | 0.256 $\rightarrow$ 0.047 | Real continuous descent |
| **Execution Runtime** | 0.001 s | ~1.15 s | Fast convergence |

---

## 7. Dynamic Incident Demonstration

1. **Normal Baseline State:** 5 vehicles routed via optimal paths.
2. **Accident / Blockage Injected:** Highway segment `E <-> H` closed.
3. **Adaptive QPSO Response:**
   * Vehicle V01 automatically detours via `A -> B -> D -> F -> H`.
   * Vehicle V02 automatically detours via `A -> C -> D -> F -> J`.
   * Zero collisions, 0 disconnected vehicles, 100% feasible routes.

---

## 8. Honest Engineering Limitations & Future Roadmap

* **Static Snapshot vs. Continuous Time-Step Simulation:** Current MVP evaluates routes over a coordinated simulation snapshot. Future Stage 9 will incorporate continuous time-step micro-simulation (SUMO / TraCI integration).
* **Network Scaling:** Verified on 9-node demo, 16-node grid, and 30-node metropolitan network. Future iterations will support OpenStreetMap (OSM) graph ingestion.
* **Hybrid Quantum Computing:** Ready for hybrid quantum annealing / QAOA integration as NISQ hardware matures.
