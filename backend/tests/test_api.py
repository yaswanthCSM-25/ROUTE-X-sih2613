"""Integration tests for FastAPI REST API (SIH26137)."""

from fastapi.testclient import TestClient
from app.api import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_api_info():
    res = client.get("/api/info")
    assert res.status_code == 200
    data = res.json()
    assert data["problem_statement_id"] == "26137"
    assert len(data["deliverables"]) >= 8


def test_api_scenarios_and_network():
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    assert len(res.json()["scenarios"]) >= 3

    res_net = client.get("/api/network?preset=demo")
    assert res_net.status_code == 200
    assert len(res_net.json()["nodes"]) == 9


def test_api_optimize():
    payload = {
        "preset": "demo",
        "num_particles": 15,
        "num_iterations": 20,
        "traffic_seed": 42,
    }
    res = client.post("/api/optimize", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "baseline" in data
    assert "qpso" in data
    assert "convergence" in data
    assert "routes" in data
    assert data["qpso"]["invalid_routes"] == 0
    assert data["baseline"]["fitness"] >= 0.0


def test_api_incident_endpoint():
    payload = {
        "preset": "demo",
        "source": "E",
        "target": "H",
        "incident_type": "ROAD_CLOSURE",
        "description": "Bridge maintenance",
    }
    res = client.post("/api/simulation/incident", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "pre_incident" in data
    assert "post_incident" in data


def test_api_scalability_endpoint():
    res = client.get("/api/benchmark/scalability?seed=42")
    assert res.status_code == 200
    data = res.json()
    assert "stages" in data
    assert len(data["stages"]) == 4
