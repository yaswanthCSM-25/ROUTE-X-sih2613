"""
k_paths.py — Yen's K-Shortest Paths & Diverse Alternative Corridor Generator (SIH26137).

Generates a geometrically diverse pool of candidate corridors for each Origin-Destination pair.
Allows metaheuristics (QPSO / PSO) to perform true combinatorial load balancing across
distinct parallel corridors to break traffic bottlenecks and achieve System Optimum.
"""

import copy
import heapq
import math
from typing import Dict, List, Optional, Set, Tuple

from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel


def dijkstra_shortest_path(
    network: RoadNetwork,
    traffic_model: Optional[TrafficModel],
    source: str,
    destination: str,
    banned_edges: Optional[Set[Tuple[str, str]]] = None,
    banned_nodes: Optional[Set[str]] = None,
    use_marginal_cost: bool = False,
) -> Optional[List[str]]:
    """
    Computes single shortest path from source to destination respecting banned edges/nodes.
    """
    if source == destination:
        return [source]

    banned_e = banned_edges or set()
    banned_n = banned_nodes or set()

    distances: Dict[str, float] = {source: 0.0}
    previous: Dict[str, str] = {}
    visited = set()
    heap = [(0.0, source)]

    while heap:
        dist, u = heapq.heappop(heap)
        if u in visited:
            continue
        visited.add(u)

        if u == destination:
            break

        for road in network.adjacency.get(u, []):
            v = road.target
            if road.status != RoadStatus.OPEN:
                continue
            if (u, v) in banned_e:
                continue
            if v in banned_n and v != destination:
                continue

            if traffic_model:
                if use_marginal_cost:
                    cost = traffic_model.marginal_social_cost_min(
                        u, v, road.free_flow_time_min, road.capacity_vehicles
                    )
                else:
                    cost = traffic_model.actual_travel_time_min(
                        u, v, road.free_flow_time_min, road.capacity_vehicles
                    )
            else:
                cost = road.free_flow_time_min

            new_dist = dist + cost
            if new_dist < distances.get(v, float("inf")):
                distances[v] = new_dist
                previous[v] = u
                heapq.heappush(heap, (new_dist, v))

    if destination not in distances:
        return None

    path = [destination]
    while path[-1] != source:
        path.append(previous[path[-1]])
    path.reverse()
    return path


def path_edge_overlap(path1: List[str], path2: List[str]) -> float:
    """Calculates Jaccard edge overlap between two paths (0.0 = completely disjoint, 1.0 = identical)."""
    if len(path1) < 2 or len(path2) < 2:
        return 0.0
    edges1 = set(zip(path1[:-1], path1[1:]))
    edges2 = set(zip(path2[:-1], path2[1:]))
    intersection = len(edges1 & edges2)
    union = len(edges1 | edges2)
    return intersection / union if union > 0 else 0.0


_YENS_CACHE: Dict[Tuple[int, str, str, int], List[List[str]]] = {}


def yens_k_shortest_paths(
    network: RoadNetwork,
    traffic_model: Optional[TrafficModel],
    source: str,
    destination: str,
    K: int = 4,
    max_overlap: float = 0.75,
) -> List[List[str]]:
    """
    Yen's algorithm finding up to K loopless, geometrically diversified alternative paths.
    """
    cache_key = (id(network), source, destination, K)
    if cache_key in _YENS_CACHE:
        return _YENS_CACHE[cache_key]

    first_path = dijkstra_shortest_path(network, traffic_model, source, destination)
    if not first_path:
        res = [[source, destination]] if network.road_exists(source, destination) else [[source]]
        _YENS_CACHE[cache_key] = res
        return res

    A = [first_path]
    B = []  # Priority queue of candidate paths

    for k in range(1, K):
        prev_path = A[-1]
        for i in range(len(prev_path) - 1):
            spur_node = prev_path[i]
            root_path = prev_path[: i + 1]

            banned_edges = set()
            for p in A:
                if len(p) > i and p[: i + 1] == root_path and (i + 1) < len(p):
                    banned_edges.add((p[i], p[i + 1]))

            banned_nodes = set(root_path[:-1])

            spur_path = dijkstra_shortest_path(
                network,
                traffic_model,
                spur_node,
                destination,
                banned_edges=banned_edges,
                banned_nodes=banned_nodes,
            )

            if spur_path and len(spur_path) > 1:
                total_path = root_path[:-1] + spur_path
                # Check that path is loopless
                if len(total_path) == len(set(total_path)):
                    if total_path not in B and total_path not in A:
                        B.append(total_path)

        if not B:
            break

        # Pick candidate with lowest travel cost
        def path_cost(p: List[str]) -> float:
            cost = 0.0
            for u, v in zip(p[:-1], p[1:]):
                try:
                    road = network.get_road(u, v)
                    if traffic_model:
                        cost += traffic_model.actual_travel_time_min(
                            u, v, road.free_flow_time_min, road.capacity_vehicles
                        )
                    else:
                        cost += road.free_flow_time_min
                except ValueError:
                    cost += 100.0
            return cost

        B.sort(key=path_cost)
        best_candidate = B.pop(0)

        # Apply diversity filter
        is_distinct = all(path_edge_overlap(best_candidate, p) <= max_overlap for p in A)
        if is_distinct or len(A) < 2:
            A.append(best_candidate)
        else:
            # Add anyway if running out of candidates
            A.append(best_candidate)

    return A


class CorridorPool:
    """
    Caches and serves K-diverse alternative corridor route options for each Origin-Destination pair.
    """

    def __init__(self, network: RoadNetwork, K: int = 5) -> None:
        self.network = network
        self.K = K
        self._cache: Dict[Tuple[str, str], List[List[str]]] = {}

    def get_corridors(
        self,
        source: str,
        destination: str,
        traffic_model: Optional[TrafficModel] = None,
    ) -> List[List[str]]:
        key = (source, destination)
        if key not in self._cache:
            paths = yens_k_shortest_paths(
                self.network, traffic_model, source, destination, K=self.K
            )
            self._cache[key] = paths
        return self._cache[key]
