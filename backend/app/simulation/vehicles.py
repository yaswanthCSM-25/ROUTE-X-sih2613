"""
vehicles.py — Vehicle fleet model and generator for Route Planner (SIH26137).

Represents vehicles in the transportation network:
    v_k = (vehicle_id, origin, destination, vehicle_type, PCE)
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
    vehicle_type: str = "Cars"  # Cars, Mixed, Bikes, Vans, Lorries, Emergency
    current_position: Optional[str] = None
    status: str = "IN_TRANSIT"
    route: List[str] = field(default_factory=list)

    def __post_init__(self):
        if self.current_position is None:
            self.current_position = self.origin

    def __repr__(self) -> str:
        return f"Vehicle({self.vehicle_id}[{self.vehicle_type}]: {self.origin} -> {self.destination})"


def build_demo_vehicles() -> List[Vehicle]:
    """Default 5 simulated vehicles for 9-node demo."""
    return [
        Vehicle("V01", "A", "H", "Cars"),
        Vehicle("V02", "A", "J", "Mixed"),
        Vehicle("V03", "B", "H", "Vans"),
        Vehicle("V04", "C", "J", "Cars"),
        Vehicle("V05", "A", "G", "Lorries"),
    ]


def build_fleet(
    count: int,
    network: RoadNetwork,
    seed: int = 42,
    fleet_composition: str = "Mixed",
) -> List[Vehicle]:
    """
    Generates a deterministic fleet of `count` vehicles across the network graph.
    """
    if len(network.nodes) < 2:
        return []

    rng = random.Random(seed)
    nodes = list(network.nodes)
    vehicles = []

    type_options = ["Cars", "Cars", "Vans", "Bikes", "Lorries"] if fleet_composition == "Mixed" else [fleet_composition]

    for i in range(count):
        vid = f"V{i + 1:02d}"
        origin = rng.choice(nodes)
        dest_candidates = [n for n in nodes if n != origin]
        destination = rng.choice(dest_candidates)
        v_type = rng.choice(type_options)
        vehicles.append(
            Vehicle(
                vehicle_id=vid,
                origin=origin,
                destination=destination,
                vehicle_type=v_type,
            )
        )

    return vehicles
