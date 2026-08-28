"""
traffic.py — Traffic simulation and congestion model for Route Planner (SIH26137).

Implements Bureau of Public Roads (BPR) congestion function:
    t_actual = t_free * (1 + alpha_bpr * (volume / capacity) ^ beta_bpr)

Includes:
    - Background stochastic/deterministic congestion
    - Multi-vehicle dynamic load coupling (n_e vehicles on road e)
    - Dynamic Incident Simulation (Accidents, Road Closures, Capacity Reductions)
"""

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple

from app.simulation.graph import RoadNetwork, RoadStatus

EdgeKey = Tuple[str, str]

# Default BPR parameters (Bureau of Public Roads standard formulation)
DEFAULT_BPR_ALPHA = 0.15
DEFAULT_BPR_BETA = 4.0
DEFAULT_SEED = 42


class IncidentType(str, Enum):
    ROAD_CLOSURE = "ROAD_CLOSURE"
    ACCIDENT = "ACCIDENT"
    CONGESTION_SPIKE = "CONGESTION_SPIKE"
    CAPACITY_DROP = "CAPACITY_DROP"


@dataclass
class Incident:
    """A dynamic road network event affecting capacity, status, or congestion."""
    source: str
    target: str
    incident_type: IncidentType
    severity: float = 1.0  # 0.0 to 1.0
    description: str = ""


class TrafficModel:
    """
    Traffic engine computing static and dynamic vehicle-coupled congestion.
    """

    def __init__(
        self,
        seed: int = DEFAULT_SEED,
        alpha_bpr: float = DEFAULT_BPR_ALPHA,
        beta_bpr: float = DEFAULT_BPR_BETA,
    ) -> None:
        self.seed = seed
        self.alpha_bpr = alpha_bpr
        self.beta_bpr = beta_bpr
        self._rng = random.Random(seed)
        self.static_congestion: Dict[EdgeKey, float] = {}
        self.vehicle_counts: Dict[EdgeKey, int] = {}
        self.incidents: List[Incident] = []

    def generate(self, network: RoadNetwork) -> Dict[EdgeKey, float]:
        """
        Assigns reproducible base background congestion c_ij in [0, 1] to all edges.
        """
        self._rng = random.Random(self.seed)
        self.static_congestion = {}
        self.vehicle_counts = {}
        for road in network.roads:
            key = (road.source, road.target)
            self.static_congestion[key] = round(self._rng.uniform(0.05, 0.85), 3)
            self.vehicle_counts[key] = 0
        return self.static_congestion

    def update_vehicle_loads(self, routes: List[List[str]]) -> Dict[EdgeKey, int]:
        """
        Counts the number of vehicles traversing each road segment simultaneously across candidate routes.
        """
        self.vehicle_counts = {k: 0 for k in self.static_congestion.keys()}
        for path in routes:
            if not path or len(path) < 2:
                continue
            for u, v in zip(path[:-1], path[1:]):
                key = (u, v)
                self.vehicle_counts[key] = self.vehicle_counts.get(key, 0) + 1
        return self.vehicle_counts

    def get_congestion(self, source: str, target: str, capacity: int = 6) -> float:
        """
        Combined congestion index in [0, 1] accounting for static background traffic
        and dynamic vehicle load relative to road capacity:
            c = min(1.0, base_c * 0.5 + (load / max(1, capacity)) * 0.5)
        """
        key = (source, target)
        base = self.static_congestion.get(key, 0.2)
        load = self.vehicle_counts.get(key, 0)
        effective_capacity = max(1, capacity)
        dynamic_ratio = load / effective_capacity
        combined = (base * 0.5) + (dynamic_ratio * 0.5)
        return round(min(1.0, max(0.0, combined)), 3)

    def actual_travel_time_min(
        self,
        source: str,
        target: str,
        free_flow_time_min: float,
        capacity: int = 6,
    ) -> float:
        """
        Bureau of Public Roads (BPR) travel time formulation:
            t = t_free * (1 + alpha * (V / C) ^ beta)
        where total volume V = dynamic_load + background_load.
        """
        if free_flow_time_min <= 0:
            return 0.1

        key = (source, target)
        base_c = self.static_congestion.get(key, 0.1)
        load = self.vehicle_counts.get(key, 0)
        effective_capacity = max(1, capacity)

        # Volume / Capacity ratio (V/C)
        # Background traffic adds virtual load: base_c * effective_capacity * 0.5
        total_volume = load + (base_c * effective_capacity * 0.5)
        vc_ratio = max(0.0, total_volume / effective_capacity)

        # BPR formula
        bpr_factor = 1.0 + self.alpha_bpr * (vc_ratio ** self.beta_bpr)
        actual_time = max(free_flow_time_min, free_flow_time_min * bpr_factor)

        return round(actual_time, 2)

    def inject_incident(self, network: RoadNetwork, incident: Incident) -> None:
        """
        Applies a dynamic incident to the road network.
        """
        self.incidents.append(incident)
        key = (incident.source, incident.target)
        rev_key = (incident.target, incident.source)

        if incident.incident_type == IncidentType.ROAD_CLOSURE:
            network.set_road_status(incident.source, incident.target, RoadStatus.CLOSED)
        elif incident.incident_type == IncidentType.ACCIDENT:
            # Major congestion spike and reduced capacity
            self.static_congestion[key] = 0.95
            self.static_congestion[rev_key] = 0.90
            try:
                road_fwd = network.get_road(incident.source, incident.target)
                road_fwd.capacity_vehicles = max(1, road_fwd.capacity_vehicles // 2)
                road_bwd = network.get_road(incident.target, incident.source)
                road_bwd.capacity_vehicles = max(1, road_bwd.capacity_vehicles // 2)
            except ValueError:
                pass
        elif incident.incident_type == IncidentType.CONGESTION_SPIKE:
            self.static_congestion[key] = 0.85
            self.static_congestion[rev_key] = 0.85
        elif incident.incident_type == IncidentType.CAPACITY_DROP:
            try:
                road_fwd = network.get_road(incident.source, incident.target)
                road_fwd.capacity_vehicles = max(1, int(road_fwd.capacity_vehicles * (1 - incident.severity * 0.5)))
            except ValueError:
                pass

    def clear_incidents(self, network: RoadNetwork) -> None:
        """Resets incidents and reopens closed roads."""
        for inc in self.incidents:
            if inc.incident_type == IncidentType.ROAD_CLOSURE:
                network.set_road_status(inc.source, inc.target, RoadStatus.OPEN)
        self.incidents = []
        self.generate(network)
