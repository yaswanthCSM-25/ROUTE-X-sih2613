"""
vehicles.py — Vehicle fleet model and generator for Route Planner (SIH26137).

Represents vehicles in the transportation network:
    v_k = (vehicle_id, origin, destination)

Supports deterministic multi-vehicle fleet generation from 5 up to 50+ vehicles.
"""

import random
from dataclasses import dataclass, field
from typing import List, Optional
from app.simulation.graph import RoadNetwork


@dataclass
class Vehicle:
    """A vehicle navigating from origin to destination."""

    vehicle_id: str
    origin: str
    destination: str
    current_position: Optional[str] = None
    status: str = "IN_TRANSIT"  # IN_TRANSIT, ARRIVED, DELAYED
    route: List[str] = field(default_factory=list)

    def __post_init__(self):
        if self.current_position is None:
            self.current_position = self.origin

    def __repr__(self) -> str:
        return f"Vehicle({self.vehicle_id}: {self.origin} -> {self.destination})"


def build_demo_vehicles() -> List[Vehicle]:
    """Default 5 simulated vehicles for 9-node demo."""
    return [
        Vehicle("V01", "A", "H"),
        Vehicle("V02", "A", "J"),
        Vehicle("V03", "B", "H"),
        Vehicle("V04", "C", "J"),
        Vehicle("V05", "A", "G"),
    ]


def build_fleet(count: int, network: RoadNetwork, seed: int = 42) -> List[Vehicle]:
    """
    Generates a deterministic fleet of `count` vehicles across the provided network graph.
    Picks distinct origin-destination pairs.
    """
    if len(network.nodes) < 2:
        return []

    rng = random.Random(seed)
    nodes = list(network.nodes)
    vehicles = []

    for i in range(count):
        vid = f"V{i + 1:02d}"
        origin = rng.choice(nodes)
        dest_candidates = [n for n in nodes if n != origin]
        destination = rng.choice(dest_candidates)
        vehicles.append(Vehicle(vehicle_id=vid, origin=origin, destination=destination))

    return vehicles
