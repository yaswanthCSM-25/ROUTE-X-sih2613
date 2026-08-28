"""
api.py — FastAPI backend REST API for Route Planner (SIH26137).

Problem Statement ID: 26137
Title: Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization
Organization: Egreen Quanta
Theme: Transportation and Logistics
"""

import os
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.analysis.benchmark import run_batch_seeds, run_benchmark, run_scalability_experiment
from app.simulation.graph import (
    RoadNetwork,
    RoadStatus,
    build_demo_network,
    build_grid_network,
    build_metropolitan_network,
    build_network_by_preset,
)
from app.simulation.traffic import (
    DEFAULT_BPR_ALPHA,
    DEFAULT_BPR_BETA,
    Incident,
    IncidentType,
    TrafficModel,
)
from app.simulation.vehicles import Vehicle, build_demo_vehicles, build_fleet

app = FastAPI(
    title="Route Planner API — SIH26137",
    description="Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems (Egreen Quanta)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================================
# Pydantic Schemas
# =========================================================================

class VehicleItem(BaseModel):
    vehicle_id: str
    origin: str
    destination: str


class WeightsModel(BaseModel):
    alpha: float = Field(0.40, description="Weight for travel time (T_norm)")
    beta: float = Field(0.30, description="Weight for travel distance (D_norm)")
    gamma: float = Field(0.30, description="Weight for congestion index (C_norm)")


class IncidentRequest(BaseModel):
    preset: str = Field("demo")
    source: str
    target: str
    incident_type: IncidentType = IncidentType.ROAD_CLOSURE
    severity: float = Field(1.0, ge=0.0, le=1.0)
    description: str = "Incident injected on road"


class BatchBenchmarkRequest(BaseModel):
    preset: str = Field("demo")
    fleet_size: int = Field(5, ge=2, le=50)
    seeds: List[int] = Field(default_factory=lambda: [42, 123, 456, 789, 1000])
    num_particles: int = Field(20, ge=5, le=50)
    num_iterations: int = Field(30, ge=10, le=100)


class OptimizeRequest(BaseModel):
    preset: str = Field("demo", description="demo, rush_hour, bridge_closure, smart_grid, or metropolitan")
    num_particles: int = Field(20, ge=5, le=100)
    num_iterations: int = Field(50, ge=10, le=200)
    traffic_seed: int = Field(42, ge=1)
    weights: WeightsModel = Field(default_factory=WeightsModel)
    road_status_overrides: Optional[Dict[str, str]] = Field(
        default=None, description="Mapping like {'D-F': 'CLOSED', 'C-E': 'CLOSED'}"
    )
    custom_vehicles: Optional[List[VehicleItem]] = None
    fleet_size: Optional[int] = None
    steps_per_vehicle: Optional[int] = None
    baseline_method: str = Field("dijkstra", description="dijkstra or astar")
    bpr_alpha: float = Field(DEFAULT_BPR_ALPHA, ge=0.0, le=2.0)
    bpr_beta: float = Field(DEFAULT_BPR_BETA, ge=1.0, le=6.0)


# =========================================================================
# Helper Functions
# =========================================================================

def get_network_for_preset(preset: str) -> RoadNetwork:
    return build_network_by_preset(preset)


def get_vehicles_for_preset(preset: str, network: RoadNetwork, custom_count: Optional[int] = None) -> List[Vehicle]:
    if custom_count and custom_count > 0:
        return build_fleet(custom_count, network, seed=42)

    if preset in ("demo", "rush_hour", "bridge_closure"):
        return build_demo_vehicles()
    elif preset == "smart_grid":
        return build_fleet(10, network, seed=42)
    elif preset == "metropolitan":
        return build_fleet(20, network, seed=42)
    return build_demo_vehicles()


# =========================================================================
# REST Endpoints
# =========================================================================

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "route-planner-api", "sih_id": "26137"}


@app.get("/api/info")
def get_project_info():
    return {
        "problem_statement_id": "26137",
        "title": "Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization",
        "organization": "Egreen Quanta",
        "department": "Egreen Quanta",
        "category": "Software",
        "theme": "Transportation and Logistics",
        "objectives": [
            "1. Design a quantum-inspired metaheuristic framework (QPSO) for multi-vehicle traffic-aware route optimization.",
            "2. Jointly minimize total travel time, distance, and congestion via multi-objective BPR optimization.",
            "3. Provide fair, quantifiable comparison against classical Dijkstra/A* baselines with statistical rigor.",
            "4. Demonstrate scalability across urban simulation prototypes (from 5 to 50 vehicles) and dynamic incident resilience.",
        ],
        "deliverables": [
            {"id": "DEL-01", "component": "Graph-Based Network Model", "status": "Delivered", "description": "Weighted directed graph G=(V,E) with spatial layout and road attributes (d, s, cap, status, t0)."},
            {"id": "DEL-02", "component": "BPR Congestion Simulation", "status": "Delivered", "description": "Bureau of Public Roads formulation coupled with dynamic vehicle load: t = t0 * (1 + alpha * (V/C)^beta)."},
            {"id": "DEL-03", "component": "Classical Baseline (Dijkstra/A*)", "status": "Delivered", "description": "Shortest-path reference benchmark evaluated with identical multi-objective fitness scoring."},
            {"id": "DEL-04", "component": "QPSO Optimization Engine", "status": "Delivered", "description": "Quantum delta-potential-well position update, mbest attractor, target-guided decoding, and guaranteed reachability."},
            {"id": "DEL-05", "component": "FastAPI REST API", "status": "Delivered", "description": "High-performance asynchronous REST endpoints for optimization, dynamic incidents, batch testing, and scalability."},
            {"id": "DEL-06", "component": "Interactive Simulation Dashboard", "status": "Delivered", "description": "React + SVG visualizer with traffic heatmaps, road closures, and fleet animation (Simulated / Experimental)."},
            {"id": "DEL-07", "component": "Convergence Analytics", "status": "Delivered", "description": "Real-time comparative KPIs, delta badges, and SVG convergence decay charts tracking global-best monotonicity."},
            {"id": "DEL-08", "component": "Dynamic Incidents & Scalability", "status": "Delivered", "description": "Real-time accident/closure injection with dynamic rerouting across 9 to 30 nodes (Stages 1 to 4)."},
        ],
    }


@app.get("/api/scenarios")
def get_scenarios():
    return {
        "scenarios": [
            {
                "id": "demo",
                "name": "Standard 9-Node Demo",
                "description": "Baseline 9-node, 14-road scenario with 5 simulated vehicles.",
                "nodes_count": 9,
                "roads_count": 14,
                "vehicles_count": 5,
            },
            {
                "id": "rush_hour",
                "name": "Rush Hour Congestion Surge",
                "description": "Heavy traffic peak on central arterial roads (seed 99).",
                "nodes_count": 9,
                "roads_count": 14,
                "vehicles_count": 5,
            },
            {
                "id": "bridge_closure",
                "name": "Emergency Bridge Closure Detour",
                "description": "Simulated blockage on Road E-H forcing dynamic vehicle rerouting.",
                "nodes_count": 9,
                "roads_count": 14,
                "vehicles_count": 5,
            },
            {
                "id": "smart_grid",
                "name": "16-Node Smart-City Grid",
                "description": "Scalable 4x4 urban grid testing multi-vehicle logistics (10 vehicles).",
                "nodes_count": 16,
                "roads_count": 30,
                "vehicles_count": 10,
            },
            {
                "id": "metropolitan",
                "name": "30-Node Metropolitan Network",
                "description": "Large-scale urban network testing 20+ vehicle logistics & ring corridors.",
                "nodes_count": 30,
                "roads_count": 52,
                "vehicles_count": 20,
            },
        ]
    }


@app.get("/api/network")
def get_network(preset: str = Query("demo")):
    network = get_network_for_preset(preset)
    return {
        "preset": preset,
        "nodes": [
            {
                "id": n,
                "x": network.node_positions.get(n, (100, 100))[0],
                "y": network.node_positions.get(n, (100, 100))[1],
            }
            for n in network.nodes
        ],
        "roads": [
            {
                "source": r.source,
                "target": r.target,
                "distance_km": r.distance_km,
                "speed_kmph": r.free_flow_speed_kmph,
                "free_time_min": round(r.free_flow_time_min, 2),
                "capacity": r.capacity_vehicles,
                "status": r.status.value,
            }
            for r in network.roads
        ],
    }


@app.get("/api/traffic")
def get_traffic(preset: str = Query("demo"), seed: int = Query(42)):
    network = get_network_for_preset(preset)
    traffic_model = TrafficModel(seed=seed)
    traffic_model.generate(network)

    traffic_data = []
    for r in network.roads:
        c_ij = traffic_model.get_congestion(r.source, r.target)
        t_act = traffic_model.actual_travel_time_min(r.source, r.target, r.free_flow_time_min, r.capacity_vehicles)
        traffic_data.append({
            "source": r.source,
            "target": r.target,
            "congestion": round(c_ij, 3),
            "actual_time_min": round(t_act, 2),
            "free_time_min": round(r.free_flow_time_min, 2),
        })

    return {"preset": preset, "seed": seed, "traffic": traffic_data}


@app.get("/api/vehicles")
def get_vehicles(preset: str = Query("demo"), count: Optional[int] = Query(None)):
    network = get_network_for_preset(preset)
    vehicles = get_vehicles_for_preset(preset, network, custom_count=count)
    return {
        "preset": preset,
        "vehicles": [
            {"vehicle_id": v.vehicle_id, "origin": v.origin, "destination": v.destination}
            for v in vehicles
        ],
    }


@app.post("/api/optimize")
def optimize_routes(req: OptimizeRequest):
    network = get_network_for_preset(req.preset)

    # Preset specific conditions
    seed = req.traffic_seed
    if req.preset == "rush_hour":
        seed = 99
    elif req.preset == "bridge_closure":
        for road in network.roads:
            if (road.source == "E" and road.target == "H") or (road.source == "H" and road.target == "E"):
                road.status = RoadStatus.CLOSED

    # User road overrides
    if req.road_status_overrides:
        for key, status_str in req.road_status_overrides.items():
            parts = key.replace("->", "-").split("-")
            if len(parts) == 2:
                u, v = parts[0].strip(), parts[1].strip()
                status_enum = RoadStatus.CLOSED if status_str.upper() == "CLOSED" else RoadStatus.OPEN
                network.set_road_status(u, v, status_enum)

    # Initialize Traffic with BPR
    traffic_model = TrafficModel(seed=seed, alpha_bpr=req.bpr_alpha, beta_bpr=req.bpr_beta)
    traffic_model.generate(network)

    # Vehicles fleet
    if req.custom_vehicles and len(req.custom_vehicles) > 0:
        vehicles = [Vehicle(v.vehicle_id, v.origin, v.destination) for v in req.custom_vehicles]
    else:
        vehicles = get_vehicles_for_preset(req.preset, network, custom_count=req.fleet_size)

    # Determine steps per vehicle
    steps = req.steps_per_vehicle
    if not steps:
        if req.preset == "metropolitan":
            steps = 22
        elif req.preset == "smart_grid":
            steps = 16
        else:
            steps = 12

    # Weights
    w_dict = {"alpha": req.weights.alpha, "beta": req.weights.beta, "gamma": req.weights.gamma}
    w_sum = sum(w_dict.values())
    if w_sum > 0:
        w_dict = {k: v / w_sum for k, v in w_dict.items()}

    # Run Benchmark
    result = run_benchmark(
        network=network,
        traffic_model=traffic_model,
        vehicles=vehicles,
        steps_per_vehicle=steps,
        num_particles=req.num_particles,
        num_iterations=req.num_iterations,
        weights=w_dict,
        seed=seed,
        baseline_method=req.baseline_method,
    )

    # Enrich payload with network nodes & road metadata
    result["network"] = {
        "nodes": [
            {
                "id": n,
                "x": network.node_positions.get(n, (100, 100))[0],
                "y": network.node_positions.get(n, (100, 100))[1],
            }
            for n in network.nodes
        ],
        "roads": [
            {
                "source": r.source,
                "target": r.target,
                "distance_km": r.distance_km,
                "speed_kmph": r.free_flow_speed_kmph,
                "free_time_min": round(r.free_flow_time_min, 2),
                "capacity": r.capacity_vehicles,
                "status": r.status.value,
                "load": traffic_model.vehicle_counts.get((r.source, r.target), 0),
                "congestion": round(traffic_model.get_congestion(r.source, r.target), 3),
                "actual_time_min": round(
                    traffic_model.actual_travel_time_min(r.source, r.target, r.free_flow_time_min, r.capacity_vehicles), 2
                ),
            }
            for r in network.roads
        ],
    }
    result["vehicles"] = [
        {"vehicle_id": v.vehicle_id, "origin": v.origin, "destination": v.destination}
        for v in vehicles
    ]
    result["preset"] = req.preset

    return result


@app.post("/api/simulation/incident")
def trigger_incident(req: IncidentRequest):
    """
    Injects a dynamic incident on a road segment and runs optimization to compute adaptive rerouting.
    """
    network = get_network_for_preset(req.preset)
    traffic_model = TrafficModel(seed=42)
    traffic_model.generate(network)
    vehicles = get_vehicles_for_preset(req.preset, network)

    # 1. Pre-incident run
    pre_result = run_benchmark(
        network=network,
        traffic_model=traffic_model,
        vehicles=vehicles,
        steps_per_vehicle=12,
        num_particles=20,
        num_iterations=30,
        seed=42,
    )

    # 2. Inject incident
    incident = Incident(
        source=req.source,
        target=req.target,
        incident_type=req.incident_type,
        severity=req.severity,
        description=req.description,
    )
    traffic_model.inject_incident(network, incident)

    # 3. Post-incident re-optimization
    post_result = run_benchmark(
        network=network,
        traffic_model=traffic_model,
        vehicles=vehicles,
        steps_per_vehicle=12,
        num_particles=25,
        num_iterations=40,
        seed=42,
    )

    return {
        "incident": {
            "source": req.source,
            "target": req.target,
            "type": req.incident_type.value,
            "description": req.description,
        },
        "pre_incident": pre_result,
        "post_incident": post_result,
    }


@app.post("/api/benchmark/batch")
def run_batch_benchmark(req: BatchBenchmarkRequest):
    """
    Executes a multi-seed statistical analysis across seeds to prove algorithmic repeatability.
    """
    def net_factory():
        return get_network_for_preset(req.preset)

    def fleet_factory(net, seed):
        return build_fleet(req.fleet_size, net, seed=seed)

    steps = 16 if req.preset == "smart_grid" else (22 if req.preset == "metropolitan" else 12)

    batch_res = run_batch_seeds(
        network_fn=net_factory,
        fleet_fn=fleet_factory,
        seeds=req.seeds,
        num_particles=req.num_particles,
        num_iterations=req.num_iterations,
        steps_per_vehicle=steps,
    )
    return batch_res


@app.get("/api/benchmark/scalability")
def get_scalability_benchmark(seed: int = Query(42)):
    """
    Executes standard 4-stage scalability experiment across simulation prototypes.
    """
    return run_scalability_experiment(seed=seed)


# =========================================================================
# Static Production Frontend Mounting
# =========================================================================
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
