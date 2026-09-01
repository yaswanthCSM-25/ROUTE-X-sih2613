"""
traffic.py — Advanced Transportation Traffic Simulation and Congestion Engine (SIH26137).

Implements:
- Bureau of Public Roads (BPR) link performance function
- Akçelik intersection queue overflow delay for oversaturated conditions (V/C > 1.0)
- Passenger Car Equivalent (PCE) dynamic load coupling
- Environmental Weather & Road Surface friction modifiers
- Wardrop Marginal Social Cost (MC_e) computation for System Optimum benchmarking
- Dynamic incident simulation (Accidents, Closures, Capacity Reductions)
"""

import random
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple

from app.simulation.emissions import VEHICLE_PCE
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
    Advanced traffic engine computing BPR congestion, Akcelik queue delays,
    PCE vehicle loads, weather friction, and Wardrop System Optimum marginal costs.
    """

    def __init__(
        self,
        seed: int = DEFAULT_SEED,
        alpha_bpr: float = DEFAULT_BPR_ALPHA,
        beta_bpr: float = DEFAULT_BPR_BETA,
        weather: str = "Normal",
        surface_good_pct: float = 60.0,
        surface_bad_pct: float = 20.0,
    ) -> None:
        self.seed = seed
        self.alpha_bpr = alpha_bpr
        self.beta_bpr = beta_bpr
        self.weather = weather
        self.surface_good_pct = surface_good_pct
        self.surface_bad_pct = surface_bad_pct
        self._rng = random.Random(seed)
        self.static_congestion: Dict[EdgeKey, float] = {}
        self.vehicle_counts: Dict[EdgeKey, float] = {}  # In PCE units
        self.incidents: List[Incident] = []

    @property
    def weather_speed_multiplier(self) -> float:
        """Speed reduction factor from adverse environmental weather."""
        w = self.weather.lower()
        if "rain" in w:
            return 0.80  # 20% speed drop in heavy rain
        elif "wind" in w:
            return 0.88
        elif "sun" in w:
            return 1.05
        return 1.0  # Normal

    @property
    def surface_capacity_multiplier(self) -> float:
        """Capacity adjustment factor based on road surface quality distribution."""
        # Weighted surface quality factor
        good = self.surface_good_pct / 100.0
        bad = self.surface_bad_pct / 100.0
        avg = max(0.0, 1.0 - good - bad)
        factor = (good * 1.0) + (avg * 0.88) + (bad * 0.65)
        return max(0.5, min(1.2, factor))

    def generate(self, network: RoadNetwork) -> Dict[EdgeKey, float]:
        """
        Assigns reproducible base background congestion c_ij in [0.05, 0.75] to all edges.
        """
        self._rng = random.Random(self.seed)
        self.static_congestion = {}
        self.vehicle_counts = {}
        for road in network.roads:
            key = (road.source, road.target)
            self.static_congestion[key] = round(self._rng.uniform(0.05, 0.65), 3)
            self.vehicle_counts[key] = 0.0
        return self.static_congestion

    def update_vehicle_loads(
        self,
        routes: List[List[str]],
        vehicle_types: Optional[List[str]] = None,
    ) -> Dict[EdgeKey, float]:
        """
        Counts the PCE load of vehicles traversing each road segment simultaneously.
        """
        self.vehicle_counts = {k: 0.0 for k in self.static_congestion.keys()}
        for i, path in enumerate(routes):
            if not path or len(path) < 2:
                continue
            v_type = vehicle_types[i] if (vehicle_types and i < len(vehicle_types)) else "Cars"
            pce = VEHICLE_PCE.get(v_type, 1.0)
            for u, v in zip(path[:-1], path[1:]):
                key = (u, v)
                self.vehicle_counts[key] = self.vehicle_counts.get(key, 0.0) + pce
        return self.vehicle_counts

    def get_effective_capacity(self, capacity: int) -> float:
        """Effective capacity adjusted by road surface quality."""
        base_cap = max(1, capacity)
        return max(1.0, base_cap * self.surface_capacity_multiplier)

    def get_vc_ratio(self, source: str, target: str, capacity: int = 6) -> float:
        """Volume-to-Capacity ratio (V/C) on link (source, target)."""
        key = (source, target)
        base_c = self.static_congestion.get(key, 0.15)
        eff_cap = self.get_effective_capacity(capacity)
        load = self.vehicle_counts.get(key, 0.0)
        total_vol = load + (base_c * eff_cap * 0.8)
        return total_vol / max(0.1, eff_cap)

    def get_congestion(self, source: str, target: str, capacity: int = 6) -> float:
        """
        Combined non-linear congestion index in [0, 1].
        """
        vc = self.get_vc_ratio(source, target, capacity)
        combined = min(1.0, max(0.0, vc * 0.75 + self.static_congestion.get((source, target), 0.15) * 0.25))
        return round(combined, 3)

    def actual_travel_time_min(
        self,
        source: str,
        target: str,
        free_flow_time_min: float,
        capacity: int = 6,
    ) -> float:
        """
        Bureau of Public Roads (BPR) with Akçelik Oversaturation Queue Delay:
            t = t_0_eff * [1 + alpha * (V/C)^beta] + t_queue(V/C)
        """
        if free_flow_time_min <= 0:
            return 0.1

        # Effective free flow time under current weather conditions
        t_0_eff = free_flow_time_min / self.weather_speed_multiplier

        vc = self.get_vc_ratio(source, target, capacity)

        # Standard BPR component
        bpr_factor = 1.0 + self.alpha_bpr * (vc ** self.beta_bpr)
        actual_time = t_0_eff * bpr_factor

        # Akçelik queue overflow delay when oversaturated (V/C > 1.0)
        if vc > 1.0:
            oversaturation_delay_min = 1.5 * ((vc - 1.0) ** 1.5)
            actual_time += oversaturation_delay_min

        return round(actual_time, 2)

    def marginal_social_cost_min(
        self,
        source: str,
        target: str,
        free_flow_time_min: float,
        capacity: int = 6,
    ) -> float:
        """
        Wardrop's System Optimum Marginal Social Cost:
            MC_e = d/dV [V * t_e(V)] = t_0_eff * [1 + alpha * (beta + 1) * (V/C)^beta]
        Used for System Optimum (SO) benchmarking.
        """
        if free_flow_time_min <= 0:
            return 0.1

        t_0_eff = free_flow_time_min / self.weather_speed_multiplier
        vc = self.get_vc_ratio(source, target, capacity)

        # Exact derivative of total system delay function
        marginal_factor = 1.0 + self.alpha_bpr * (self.beta_bpr + 1.0) * (vc ** self.beta_bpr)
        marginal_cost = t_0_eff * marginal_factor

        if vc > 1.0:
            marginal_cost += 3.0 * (vc - 1.0)

        return round(marginal_cost, 2)

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
            self.static_congestion[key] = 0.95
            self.static_congestion[rev_key] = 0.90
            try:
                road_fwd = network.get_road(incident.source, incident.target)
                road_fwd.capacity_vehicles = max(1, road_fwd.capacity_vehicles // 3)
                road_rev = network.get_road(incident.target, incident.source)
                road_rev.capacity_vehicles = max(1, road_rev.capacity_vehicles // 3)
            except ValueError:
                pass
        elif incident.incident_type == IncidentType.CONGESTION_SPIKE:
            self.static_congestion[key] = min(1.0, self.static_congestion.get(key, 0.3) + 0.5 * incident.severity)
            self.static_congestion[rev_key] = min(1.0, self.static_congestion.get(rev_key, 0.3) + 0.5 * incident.severity)
        elif incident.incident_type == IncidentType.CAPACITY_DROP:
            try:
                road_fwd = network.get_road(incident.source, incident.target)
                road_fwd.capacity_vehicles = max(1, int(road_fwd.capacity_vehicles * (1.0 - 0.5 * incident.severity)))
                road_rev = network.get_road(incident.target, incident.source)
                road_rev.capacity_vehicles = max(1, int(road_rev.capacity_vehicles * (1.0 - 0.5 * incident.severity)))
            except ValueError:
                pass

    def clear_incidents(self, network: RoadNetwork) -> None:
        """Clears all active incidents and restores open road statuses."""
        self.incidents.clear()
        for road in network.roads:
            road.status = RoadStatus.OPEN
        self.generate(network)
