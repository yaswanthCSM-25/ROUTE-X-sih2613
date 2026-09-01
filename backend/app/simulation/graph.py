"""
graph.py — Transportation network model for Route Planner (SIH26137).

Represents the city as a graph G = (V, E):
    V = intersections / nodes
    E = road segments / edges

Every road segment stores:
    edge_id                -> unique identifier
    source                 -> origin node
    target                 -> destination node
    distance_km            -> physical road length
    free_flow_speed_kmph   -> speed limit
    capacity_vehicles      -> road capacity for BPR congestion modeling
    current_vehicle_count  -> dynamic vehicle load
    status                 -> OPEN or CLOSED (hard constraint)
    node_positions         -> (x, y) coordinates for visualization
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple


class RoadStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


@dataclass
class Road:
    """A single road edge between two nodes with physical and traffic attributes."""

    source: str
    target: str
    distance_km: float
    free_flow_speed_kmph: float
    capacity_vehicles: int
    status: RoadStatus = RoadStatus.OPEN
    current_vehicle_count: float = 0.0
    lanes: int = 2
    road_condition: str = "Good"  # Good, Average, Bad
    width_m: float = 7.0
    is_one_way: bool = False
    edge_id: Optional[str] = None

    def __post_init__(self):
        if self.edge_id is None:
            self.edge_id = f"{self.source}->{self.target}"

    @property
    def free_flow_time_min(self) -> float:
        """
        Free-flow travel time in minutes:
            t_free = (distance_km / speed_kmph) * 60
        """
        if self.free_flow_speed_kmph <= 0:
            return 999.0
        return (self.distance_km / self.free_flow_speed_kmph) * 60

    @property
    def congestion_ratio(self) -> float:
        """Ratio of current vehicle count to road capacity."""
        if self.capacity_vehicles <= 0:
            return 1.0
        return self.current_vehicle_count / self.capacity_vehicles

    def __repr__(self) -> str:
        return (
            f"Road({self.source}->{self.target}, "
            f"{self.distance_km:.1f}km, {self.free_flow_speed_kmph:.0f}km/h, "
            f"lanes={self.lanes}, cap={self.capacity_vehicles}, load={self.current_vehicle_count:.1f}, {self.status.value})"
        )


class RoadNetwork:
    """
    Transportation graph G = (V, E) with spatial layout and adjacency indexing.
    """

    def __init__(self) -> None:
        self.nodes: List[str] = []
        self.roads: List[Road] = []
        self.adjacency: Dict[str, List[Road]] = {}
        self.node_positions: Dict[str, Tuple[float, float]] = {}

    def add_node(self, node: str, pos: Tuple[float, float] = None) -> None:
        if node not in self.nodes:
            self.nodes.append(node)
            self.adjacency[node] = []
        if pos is not None:
            self.node_positions[node] = pos

    def add_road(
        self,
        source: str,
        target: str,
        distance_km: float,
        free_flow_speed_kmph: float,
        capacity_vehicles: int,
        status: RoadStatus = RoadStatus.OPEN,
        bidirectional: bool = True,
        lanes: int = 2,
        road_condition: str = "Good",
        width_m: float = 7.0,
    ) -> None:
        self.add_node(source)
        self.add_node(target)

        forward = Road(
            source=source,
            target=target,
            distance_km=distance_km,
            free_flow_speed_kmph=free_flow_speed_kmph,
            capacity_vehicles=capacity_vehicles,
            status=status,
            lanes=lanes,
            road_condition=road_condition,
            width_m=width_m,
            is_one_way=not bidirectional,
        )
        self.roads.append(forward)
        self.adjacency[source].append(forward)

        if bidirectional:
            backward = Road(
                source=target,
                target=source,
                distance_km=distance_km,
                free_flow_speed_kmph=free_flow_speed_kmph,
                capacity_vehicles=capacity_vehicles,
                status=status,
                lanes=lanes,
                road_condition=road_condition,
                width_m=width_m,
                is_one_way=False,
            )
            self.roads.append(backward)
            self.adjacency[target].append(backward)

    def get_road(self, source: str, target: str) -> Road:
        for road in self.adjacency.get(source, []):
            if road.target == target:
                return road
        raise ValueError(f"No road exists from {source} to {target}")

    def road_exists(self, source: str, target: str) -> bool:
        return any(r.target == target for r in self.adjacency.get(source, []))

    def neighbors(self, node: str) -> List[str]:
        return [r.target for r in self.adjacency.get(node, [])]

    def edge_key(self, source: str, target: str) -> Tuple[str, str]:
        return (source, target)

    def set_road_status(self, source: str, target: str, status: RoadStatus, bidirectional: bool = True) -> None:
        """Sets status (OPEN/CLOSED) on a road segment."""
        for r in self.roads:
            if r.source == source and r.target == target:
                r.status = status
            elif bidirectional and r.source == target and r.target == source:
                r.status = status

    def reset_vehicle_counts(self) -> None:
        """Resets all road vehicle counts to 0."""
        for r in self.roads:
            r.current_vehicle_count = 0


# =========================================================================
# Preset Network Generators (9-node, 16-node Grid, 30-node Metropolitan)
# =========================================================================

def build_demo_network() -> RoadNetwork:
    """
    Standard 9-node demo network (9 nodes, 14 bidirectional roads = 28 directed edges).
    """
    network = RoadNetwork()

    positions = {
        "A": (80, 200),
        "B": (220, 90),
        "C": (220, 310),
        "D": (380, 110),
        "E": (380, 310),
        "F": (540, 90),
        "G": (540, 310),
        "H": (520, 200),
        "J": (680, 200),
    }

    for node, pos in positions.items():
        network.add_node(node, pos)

    roads = [
        ("A", "B", 2.0, 40, 6),
        ("A", "C", 3.0, 40, 6),
        ("B", "C", 1.2, 30, 4),
        ("B", "D", 2.5, 40, 6),
        ("C", "D", 1.5, 30, 5),
        ("C", "E", 2.4, 40, 5),
        ("D", "E", 1.8, 30, 4),
        ("D", "F", 2.2, 40, 6),
        ("E", "G", 2.0, 40, 5),
        ("E", "H", 3.0, 50, 6),
        ("F", "H", 1.6, 30, 4),
        ("F", "J", 2.8, 40, 5),
        ("G", "J", 2.1, 30, 4),
        ("H", "J", 1.9, 30, 4),
    ]

    for source, target, distance, speed, capacity in roads:
        network.add_road(source, target, distance, speed, capacity)

    return network


def build_grid_network() -> RoadNetwork:
    """
    16-node smart-city grid network (4x4, 30 bidirectional roads = 60 directed edges).
    """
    network = RoadNetwork()
    rows, cols = 4, 4
    start_x, start_y = 80, 80
    gap_x, gap_y = 180, 90

    grid_nodes = {}
    for r in range(rows):
        for c in range(cols):
            name = f"N{r * cols + c + 1:02d}"
            pos = (start_x + c * gap_x, start_y + r * gap_y)
            grid_nodes[(r, c)] = name
            network.add_node(name, pos)

    # Grid roads
    for r in range(rows):
        for c in range(cols):
            u = grid_nodes[(r, c)]
            if c + 1 < cols:
                v = grid_nodes[(r, c + 1)]
                network.add_road(u, v, distance_km=2.0 + (r * 0.2), free_flow_speed_kmph=40, capacity_vehicles=8)
            if r + 1 < rows:
                v = grid_nodes[(r + 1, c)]
                network.add_road(u, v, distance_km=1.8 + (c * 0.3), free_flow_speed_kmph=35, capacity_vehicles=6)

    # Diagonal arterial corridors
    network.add_road("N01", "N06", distance_km=2.5, free_flow_speed_kmph=50, capacity_vehicles=10)
    network.add_road("N06", "N11", distance_km=2.5, free_flow_speed_kmph=50, capacity_vehicles=10)
    network.add_road("N11", "N16", distance_km=2.5, free_flow_speed_kmph=50, capacity_vehicles=10)
    network.add_road("N04", "N07", distance_km=2.4, free_flow_speed_kmph=45, capacity_vehicles=8)
    network.add_road("N07", "N10", distance_km=2.4, free_flow_speed_kmph=45, capacity_vehicles=8)
    network.add_road("N10", "N13", distance_km=2.4, free_flow_speed_kmph=45, capacity_vehicles=8)

    return network


def build_metropolitan_network() -> RoadNetwork:
    """
    30-node Metropolitan Smart City Network (30 nodes, 52 bidirectional roads = 104 directed edges).
    Demonstrates large-scale urban logistics scalability.
    """
    network = RoadNetwork()
    rows, cols = 5, 6
    start_x, start_y = 60, 60
    gap_x, gap_y = 130, 75

    grid_nodes = {}
    for r in range(rows):
        for c in range(cols):
            name = f"M{r * cols + c + 1:02d}"
            pos = (start_x + c * gap_x, start_y + r * gap_y)
            grid_nodes[(r, c)] = name
            network.add_node(name, pos)

    # Grid roads
    for r in range(rows):
        for c in range(cols):
            u = grid_nodes[(r, c)]
            if c + 1 < cols:
                v = grid_nodes[(r, c + 1)]
                network.add_road(u, v, distance_km=1.5 + (r * 0.1), free_flow_speed_kmph=45, capacity_vehicles=10)
            if r + 1 < rows:
                v = grid_nodes[(r + 1, c)]
                network.add_road(u, v, distance_km=1.4 + (c * 0.1), free_flow_speed_kmph=40, capacity_vehicles=8)

    # Express ring & cross-city arterials
    express_edges = [
        ("M01", "M08", 2.2, 60, 14),
        ("M08", "M15", 2.2, 60, 14),
        ("M15", "M22", 2.2, 60, 14),
        ("M22", "M29", 2.2, 60, 14),
        ("M06", "M11", 2.3, 55, 12),
        ("M11", "M16", 2.3, 55, 12),
        ("M16", "M21", 2.3, 55, 12),
        ("M21", "M26", 2.3, 55, 12),
        ("M03", "M16", 3.0, 60, 16),
        ("M14", "M27", 3.0, 60, 16),
    ]
    for u, v, dist, spd, cap in express_edges:
        network.add_road(u, v, distance_km=dist, free_flow_speed_kmph=spd, capacity_vehicles=cap)

    return network


def build_network_by_preset(preset: str) -> RoadNetwork:
    """Builds a network instance given a preset name."""
    if preset in ("demo", "rush_hour", "bridge_closure"):
        return build_demo_network()
    elif preset == "smart_grid":
        return build_grid_network()
    elif preset == "metropolitan":
        return build_metropolitan_network()
    return build_demo_network()
