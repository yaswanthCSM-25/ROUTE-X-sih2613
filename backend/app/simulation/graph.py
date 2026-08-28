"""
graph.py — Transportation network model for Route Planner (SIH26137).

Represents the city as a graph G = (V, E):
    V = intersections / nodes
    E = roads / edges

Every road stores the physical properties required for route evaluation
and QPSO optimization:
    distance_km            -> d_ij
    free_flow_speed_kmph   -> derived free-flow travel time t_ij
    capacity_vehicles      -> road capacity
    status                 -> OPEN or CLOSED (hard constraint)
    node_positions         -> (x, y) coordinates for visualization
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Tuple


class RoadStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


@dataclass
class Road:
    """A single road (edge) between two nodes."""

    source: str
    target: str
    distance_km: float
    free_flow_speed_kmph: float
    capacity_vehicles: int
    status: RoadStatus = RoadStatus.OPEN

    @property
    def free_flow_time_min(self) -> float:
        """
        Free-flow travel time in minutes:
            t_free = (distance_km / speed_kmph) * 60
        """
        return (self.distance_km / self.free_flow_speed_kmph) * 60

    def __repr__(self) -> str:
        return (
            f"Road({self.source}->{self.target}, "
            f"{self.distance_km} km, {self.free_flow_speed_kmph} km/h, "
            f"cap={self.capacity_vehicles}, {self.status.value})"
        )


class RoadNetwork:
    """
    Transportation graph G = (V, E) with 2D visual layout support.
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
    ) -> None:
        self.add_node(source)
        self.add_node(target)

        forward = Road(
            source, target, distance_km, free_flow_speed_kmph,
            capacity_vehicles, status,
        )
        self.roads.append(forward)
        self.adjacency[source].append(forward)

        if bidirectional:
            backward = Road(
                target, source, distance_km, free_flow_speed_kmph,
                capacity_vehicles, status,
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


def build_demo_network() -> RoadNetwork:
    """
    Default 9-node demo network for Route Planner.
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
    16-node smart-city grid network (4x4) representing scalable urban logistics.
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

    # Horizontal and vertical roads
    for r in range(rows):
        for c in range(cols):
            u = grid_nodes[(r, c)]
            if c + 1 < cols:
                v = grid_nodes[(r, c + 1)]
                network.add_road(u, v, distance_km=2.0 + (r * 0.2), free_flow_speed_kmph=40, capacity_vehicles=8)
            if r + 1 < rows:
                v = grid_nodes[(r + 1, c)]
                network.add_road(u, v, distance_km=1.8 + (c * 0.3), free_flow_speed_kmph=35, capacity_vehicles=6)

    # Diagonal arterial connections
    network.add_road("N01", "N06", distance_km=2.5, free_flow_speed_kmph=50, capacity_vehicles=10)
    network.add_road("N06", "N11", distance_km=2.5, free_flow_speed_kmph=50, capacity_vehicles=10)
    network.add_road("N11", "N16", distance_km=2.5, free_flow_speed_kmph=50, capacity_vehicles=10)
    network.add_road("N04", "N07", distance_km=2.4, free_flow_speed_kmph=45, capacity_vehicles=8)
    network.add_road("N07", "N10", distance_km=2.4, free_flow_speed_kmph=45, capacity_vehicles=8)
    network.add_road("N10", "N13", distance_km=2.4, free_flow_speed_kmph=45, capacity_vehicles=8)

    return network
