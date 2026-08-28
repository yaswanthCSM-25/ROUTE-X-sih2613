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

from app.analysis.benchmark import run_benchmark
from app.simulation.graph import (
    RoadNetwork,
    RoadStatus,
    build_demo_network,
    build_grid_network,
)
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle, build_demo_vehicles

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


class VehicleItem(BaseModel):
    vehicle_id: str
    origin: str
    destination: str


class WeightsModel(BaseModel):
    alpha: float = Field(0.40, description="Weight for travel time (T_norm)")
    beta: float = Field(0.30, description="Weight for travel distance (D_norm)")
    gamma: float = Field(0.30, description="Weight for congestion index (C_norm)")


class OptimizeRequest(BaseModel):
    preset: str = Field("demo", description="demo, rush_hour, bridge_closure, or smart_grid")
    num_particles: int = Field(20, ge=5, le=100)
    num_iterations: int = Field(50, ge=10, le=200)
    traffic_seed: int = Field(42, ge=1)
    weights: WeightsModel = Field(default_factory=WeightsModel)
    road_status_overrides: Optional[Dict[str, str]] = Field(
        default=None, description="Mapping like {'D-F': 'CLOSED', 'C-E': 'CLOSED'}"
    )
    custom_vehicles: Optional[List[VehicleItem]] = None
    steps_per_vehicle: int = Field(12, ge=6, le=30)


def get_network_for_preset(preset: str) -> RoadNetwork:
    if preset in ("demo", "rush_hour", "bridge_closure"):
        return build_demo_network()
    elif preset == "smart_grid":
        return build_grid_network()
    else:
        return build_demo_network()


def get_vehicles_for_preset(preset: str, network: RoadNetwork) -> List[Vehicle]:
    if preset == "smart_grid":
        return [
            Vehicle("V01", "N01", "N16"),
            Vehicle("V02", "N04", "N13"),
            Vehicle("V03", "N02", "N15"),
            Vehicle("V04", "N05", "N12"),
            Vehicle("V05", "N03", "N14"),
            Vehicle("V06", "N01", "N11"),
        ]
    return build_demo_vehicles()


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
            "1. Design a quantum-inspired metaheuristic framework capable of solving large-scale VRP and shortest-path problems.",
            "2. Minimize total travel time, distance, and traffic congestion.",
            "3. Reduce computational complexity while improving convergence speed and solution quality compared with classical algorithms.",
            "4. Demonstrate scalability for smart-city logistics and intelligent transportation systems.",
        ],
        "deliverables": [
            {"id": "DEL-01", "component": "Graph-Based Network Model", "status": "Delivered", "description": "Weighted directed/bidirectional network model with spatial coordinates."},
            {"id": "DEL-02", "component": "Traffic & Congestion Engine", "status": "Delivered", "description": "Stochastic road-specific congestion simulation and travel time adjustments."},
            {"id": "DEL-03", "component": "Classical Dijkstra Baseline", "status": "Delivered", "description": "Reference shortest-path benchmark computing travel time, distance, and congestion."},
            {"id": "DEL-04", "component": "QPSO Metaheuristic Engine", "status": "Delivered", "description": "Quantum delta-potential-well position updates, mbest attractor, and multi-objective normalization."},
            {"id": "DEL-05", "component": "FastAPI REST API", "status": "Delivered", "description": "High-performance asynchronous backend services."},
            {"id": "DEL-06", "component": "Interactive Web Visualizer", "status": "Delivered", "description": "Modern dark UI, traffic heatmaps, road toggle controls, and vehicle route animations."},
            {"id": "DEL-07", "component": "Convergence Analytics", "status": "Delivered", "description": "Real-time comparative KPIs, delta badges, and SVG convergence charts."},
            {"id": "DEL-08", "component": "Smart-City Scaling Presets", "status": "Delivered", "description": "Pre-configured scenarios from 9-node demo to 16-node smart-city grid."},
        ],
    }


@app.get("/api/scenarios")
def get_scenarios():
    return {
        "scenarios": [
            {
                "id": "demo",
                "name": "Standard 9-Node Network",
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
                "description": "Scalable 4x4 urban grid testing multi-vehicle logistics (6 vehicles).",
                "nodes_count": 16,
                "roads_count": 30,
                "vehicles_count": 6,
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
        t_act = traffic_model.actual_travel_time_min(r.source, r.target, r.free_flow_time_min)
        traffic_data.append({
            "source": r.source,
            "target": r.target,
            "congestion": round(c_ij, 3),
            "actual_time_min": round(t_act, 2),
            "free_time_min": round(r.free_flow_time_min, 2),
        })

    return {"preset": preset, "seed": seed, "traffic": traffic_data}


@app.get("/api/vehicles")
def get_vehicles(preset: str = Query("demo")):
    network = get_network_for_preset(preset)
    vehicles = get_vehicles_for_preset(preset, network)
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

    # Apply preset-specific conditions
    seed = req.traffic_seed
    if req.preset == "rush_hour":
        seed = 99
    elif req.preset == "bridge_closure":
        # Force road E->H and H->E closed
        for road in network.roads:
            if (road.source == "E" and road.target == "H") or (road.source == "H" and road.target == "E"):
                road.status = RoadStatus.CLOSED

    # Apply user-supplied road status overrides
    if req.road_status_overrides:
        for key, status_str in req.road_status_overrides.items():
            parts = key.replace("->", "-").split("-")
            if len(parts) == 2:
                u, v = parts[0].strip(), parts[1].strip()
                status_enum = RoadStatus.CLOSED if status_str.upper() == "CLOSED" else RoadStatus.OPEN
                for r in network.roads:
                    if (r.source == u and r.target == v) or (r.source == v and r.target == u):
                        r.status = status_enum

    # Generate traffic
    traffic_model = TrafficModel(seed=seed)
    traffic_model.generate(network)

    # Vehicles
    if req.custom_vehicles and len(req.custom_vehicles) > 0:
        vehicles = [Vehicle(v.vehicle_id, v.origin, v.destination) for v in req.custom_vehicles]
    else:
        vehicles = get_vehicles_for_preset(req.preset, network)

    # Normalization of weights
    w_dict = {"alpha": req.weights.alpha, "beta": req.weights.beta, "gamma": req.weights.gamma}
    w_sum = sum(w_dict.values())
    if w_sum > 0:
        w_dict = {k: v / w_sum for k, v in w_dict.items()}

    # Run Benchmark & QPSO
    result = run_benchmark(
        network=network,
        traffic_model=traffic_model,
        vehicles=vehicles,
        steps_per_vehicle=req.steps_per_vehicle,
        num_particles=req.num_particles,
        num_iterations=req.num_iterations,
        weights=w_dict,
        seed=seed,
    )

    # Enrich payload with network nodes & road metadata for immediate rendering
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
                "congestion": round(traffic_model.get_congestion(r.source, r.target), 3),
                "actual_time_min": round(traffic_model.actual_travel_time_min(r.source, r.target, r.free_flow_time_min), 2),
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


# Static Production Frontend Mounting (Serves built React SPA from /)
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
