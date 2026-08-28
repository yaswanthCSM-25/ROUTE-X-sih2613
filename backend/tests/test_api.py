"""Integration tests for FastAPI REST API."""

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
