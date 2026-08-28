"""
vehicles.py — Vehicle model for Route Planner.

For the MVP, a vehicle k is simply:

    v_k = (s_k, d_k)

where s_k is the starting node and d_k is the destination node.
Extra fields (capacity, priority, time windows, etc.) can be added later
once the base pipeline is proven correct.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class Vehicle:
    vehicle_id: str
    origin: str
    destination: str

    def __repr__(self) -> str:
        return f"Vehicle({self.vehicle_id}: {self.origin} -> {self.destination})"


def build_demo_vehicles() -> List[Vehicle]:
    """
    5 simulated vehicles for the first Route Planner experiment.
    Origins/destinations are chosen to be reachable on the demo network
    defined in graph.py.
    """
    return [
        Vehicle("V1", "A", "H"),
        Vehicle("V2", "A", "J"),
        Vehicle("V3", "B", "H"),
        Vehicle("V4", "C", "J"),
        Vehicle("V5", "A", "G"),
    ]
