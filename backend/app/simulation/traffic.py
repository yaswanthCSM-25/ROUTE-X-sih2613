"""
traffic.py — Simulated traffic model for Route Planner.

For the MVP we do not use any real-time traffic API. Instead we generate
a reproducible, road-specific congestion value for every road in the
network:

    c_ij in [0, 1]   (0 = free-flowing, 1 = fully congested)

Using a fixed random seed makes every run of the simulation reproducible,
which matters for comparing the classical baseline against QPSO later —
both algorithms must see the exact same traffic conditions.

Actual travel time is then derived as:

    t_actual = t_free * (1 + c_ij * (M_max - 1))

which behaves like the free/medium/high traffic multiplier from our design
notes, but computed per-road instead of a single global multiplier.
"""

import random
from typing import Dict, Tuple

from app.simulation.graph import RoadNetwork

EdgeKey = Tuple[str, str]

# Congestion multiplier applied at maximum congestion (c_ij = 1.0).
# c_ij = 0.0 -> multiplier 1.0 (free flow)
# c_ij = 1.0 -> multiplier MAX_CONGESTION_MULTIPLIER
MAX_CONGESTION_MULTIPLIER = 2.0

DEFAULT_SEED = 42


class TrafficModel:
    """Generates and stores a deterministic congestion value per road."""

    def __init__(self, seed: int = DEFAULT_SEED) -> None:
        self.seed = seed
        self._rng = random.Random(seed)
        self.congestion: Dict[EdgeKey, float] = {}

    def generate(self, network: RoadNetwork) -> Dict[EdgeKey, float]:
        """
        Assigns a road-specific congestion value c_ij in [0, 1] to every
        directed road in the network. Reproducible for a given seed.
        """
        self.congestion = {}
        for road in network.roads:
            key = (road.source, road.target)
            self.congestion[key] = round(self._rng.uniform(0.0, 1.0), 2)
        return self.congestion

    def get_congestion(self, source: str, target: str) -> float:
        return self.congestion.get((source, target), 0.0)

    def actual_travel_time_min(
        self, source: str, target: str, free_flow_time_min: float
    ) -> float:
        """
        t_actual = t_free * (1 + c_ij * (M_max - 1))
        """
        c_ij = self.get_congestion(source, target)
        multiplier = 1 + c_ij * (MAX_CONGESTION_MULTIPLIER - 1)
        return free_flow_time_min * multiplier
