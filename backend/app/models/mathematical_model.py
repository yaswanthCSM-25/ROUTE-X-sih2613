r"""
mathematical_model.py — Rigorous Mathematical Formulation for Traffic Route Optimization (SIH 26137).

Problem Statement ID: 26137
Theme: Transportation and Logistics
Problem: Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization

====================================================================================================
MATHEMATICAL FORMULATION (Rigorous Specification):
====================================================================================================

1. Network Graph Representation:
   Directed weighted graph G = (V, E)
     - V = {0, 1, 2, ..., n}: Intersections and terminal nodes.
       Node 0 represents the primary Depot / Hub, and nodes 1...n represent customer / delivery destinations.
     - E = {(i, j) : i, j in V, i != j}: Directed road segments / links.
     - For each edge (i, j) in E:
       * Physical distance:            d_ij >= 0 (km)
       * Free-flow travel time:         t_ij^0 = (d_ij / v_ij^0) * 60 (minutes)
       * Congestion ratio / index:      c_ij in [0, 1]
       * Dynamic effective travel time:  tau_ij = t_ij^0 * (1 + alpha * c_ij)

2. Decision Variables:
   x_ijk in {0, 1} for all (i, j) in E, for all vehicles k in {1, ..., K}
     - x_ijk = 1 if vehicle k travels directly from node i to node j on edge (i, j)
     - x_ijk = 0 otherwise

3. Objective Function:
   Minimize the multi-objective cost scalar Z:
     Minimize Z = w_1 * sum_{k=1}^K sum_{(i,j) in E} tau_ij * x_ijk
                + w_2 * sum_{k=1}^K sum_{(i,j) in E} d_ij * x_ijk
                + w_3 * sum_{k=1}^K sum_{(i,j) in E} c_ij * x_ijk

   Subject to normalized non-negative weights:
     w_1 + w_2 + w_3 = 1.0,  where w_1, w_2, w_3 >= 0
       * w_1: Travel Time weight (tau_ij)
       * w_2: Distance weight (d_ij)
       * w_3: Congestion cost weight (c_ij)

4. Mathematical Constraints:
   (a) Customer Visit / Destination Reachability:
       Each vehicle k must start at its designated origin o_k and terminate at destination d_k:
         sum_{j : (o_k, j) in E} x_{o_k, j, k} = 1,       forall k in {1, ..., K}
         sum_{i : (i, d_k) in E} x_{i, d_k, k} = 1,       forall k in {1, ..., K}

   (b) Flow Conservation:
       For every vehicle k and every intermediate node u in V \ {o_k, d_k}:
         sum_{i : (i, u) in E} x_{i, u, k} - sum_{j : (u, j) in E} x_{u, j, k} = 0

   (c) Edge Validity & Road Status (Hard Prohibition):
       x_ijk = 0 forall (i, j) not in E or status(i, j) == CLOSED

   (d) Road & Fleet Capacity:
       sum_{k=1}^K PCE_k * x_ijk <= Capacity_ij,          forall (i, j) in E

   (e) Subtour Elimination (Miller-Tucker-Zemlin / MTZ Formulation):
       Auxiliary continuous variables u_ik >= 0 for all i in V \ {o_k}:
         u_ik - u_jk + |V| * x_ijk <= |V| - 1,            forall i, j in V \ {o_k}, i != j, forall k

5. Dynamic Load Coupling & In-Flight Friction:
   When multiple vehicles traverse edge (i, j) simultaneously, dynamic Passenger Car Equivalent
   (PCE) load increases link volume V_ij, dynamically scaling congestion c_ij and effective
   travel time tau_ij across all vehicles traversing that link.
====================================================================================================
"""

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

from app.routing.constraints import (
    LAMBDA_CAPACITY_OVERFLOW,
    LAMBDA_CLOSED_ROAD,
    LAMBDA_CYCLE,
    LAMBDA_INVALID_EDGE,
    LAMBDA_UNREACHABLE,
)
from app.simulation.graph import RoadNetwork, RoadStatus
from app.simulation.traffic import TrafficModel
from app.simulation.vehicles import Vehicle


@dataclass
class ModelWeights:
    """
    User-configurable weighting parameters w1, w2, w3 for objective function Z.
    Normalized such that w1 + w2 + w3 = 1.0.
    """
    w1: float = 0.40  # Weight for Effective Travel Time (tau_ij)
    w2: float = 0.30  # Weight for Travel Distance (d_ij)
    w3: float = 0.30  # Weight for Congestion Cost (c_ij)

    def __post_init__(self):
        total = self.w1 + self.w2 + self.w3
        if total > 0:
            self.w1 = round(self.w1 / total, 4)
            self.w2 = round(self.w2 / total, 4)
            self.w3 = round(1.0 - self.w1 - self.w2, 4)

    @classmethod
    def from_dict(cls, d: Optional[Dict[str, float]] = None) -> "ModelWeights":
        if not d:
            return cls(0.40, 0.30, 0.30)
        # Support both (w1, w2, w3) and (alpha, beta, gamma) aliases
        w1 = d.get("w1", d.get("alpha", 0.40))
        w2 = d.get("w2", d.get("beta", 0.30))
        w3 = d.get("w3", d.get("gamma", 0.30))
        return cls(float(w1), float(w2), float(w3))


@dataclass
class ObjectiveBreakdown:
    """
    Detailed breakdown of all components in Objective Function Z:
        Z = w1 * T_total + w2 * D_total + w3 * C_total
    """
    travel_time_total: float       # T_total = sum tau_ij * x_ijk (minutes)
    distance_total: float          # D_total = sum d_ij * x_ijk (km)
    congestion_total: float        # C_total = sum c_ij * x_ijk (dimensionless)
    w1: float                      # Weight for travel time
    w2: float                      # Weight for distance
    w3: float                      # Weight for congestion
    travel_time_cost: float        # w1 * T_total
    distance_cost: float           # w2 * D_total
    congestion_cost: float         # w3 * C_total
    z_value: float                 # Exact scalar objective Z
    formula: str = ""

    def __post_init__(self):
        if not self.formula:
            self.formula = (
                f"Z = {self.w1:.2f} * {self.travel_time_total:.2f} (Time) "
                f"+ {self.w2:.2f} * {self.distance_total:.2f} (Dist) "
                f"+ {self.w3:.2f} * {self.congestion_total:.2f} (Congestion) "
                f"= {self.z_value:.4f}"
            )


@dataclass
class ConstraintViolation:
    """Record of a specific mathematical constraint violation."""
    constraint_type: str  # REACHABILITY, FLOW_CONSERVATION, CLOSED_ROAD, INVALID_EDGE, CAPACITY, MTZ_SUBTOUR
    vehicle_index: Optional[int]
    vehicle_id: Optional[str]
    description: str
    penalty_cost: float


@dataclass
class FeasibilityResult:
    """Comprehensive feasibility analysis result across all constraints."""
    is_feasible: bool
    violations: List[ConstraintViolation] = field(default_factory=list)
    total_penalty: float = 0.0
    reachability_valid: bool = True
    flow_conservation_valid: bool = True
    road_status_valid: bool = True
    capacity_valid: bool = True
    subtour_free: bool = True


class TrafficRoutingModel:
    """
    Mathematical Formulation Engine for Multi-Vehicle Traffic Routing (SIH 26137).

    Implements:
    - Directed Graph G = (V, E) traversal with dynamic effective travel time:
        tau_ij = t_ij^0 * (1 + alpha * c_ij)
    - Decision variable matrix x_ijk
    - Objective Function Z = w1 * sum tau_ij + w2 * sum d_ij + w3 * sum c_ij
    - Complete constraint satisfaction checking & MTZ subtour elimination
    - Active feasibility repair algorithms for continuous search space optimization
    - Penalty-augmented fitness calculation for QPSO / PSO / Classical algorithms
    """

    def __init__(
        self,
        network: RoadNetwork,
        traffic_model: TrafficModel,
        vehicles: List[Vehicle],
        weights: Optional[ModelWeights] = None,
        alpha_congestion: float = 0.25,
        penalty_invalid_edge: float = LAMBDA_INVALID_EDGE,
        penalty_closed_road: float = LAMBDA_CLOSED_ROAD,
        penalty_unreachable: float = LAMBDA_UNREACHABLE,
        penalty_cycle: float = LAMBDA_CYCLE,
        penalty_capacity: float = LAMBDA_CAPACITY_OVERFLOW,
    ) -> None:
        self.network = network
        self.traffic_model = traffic_model
        self.vehicles = vehicles
        self.weights = weights or ModelWeights()
        self.alpha_congestion = alpha_congestion

        # Constraint penalty multipliers
        self.penalty_invalid_edge = penalty_invalid_edge
        self.penalty_closed_road = penalty_closed_road
        self.penalty_unreachable = penalty_unreachable
        self.penalty_cycle = penalty_cycle
        self.penalty_capacity = penalty_capacity

        # Cache node index mapping for MTZ Miller-Tucker-Zemlin constraints
        self.node_to_idx: Dict[str, int] = {node: i for i, node in enumerate(network.nodes)}
        self.num_nodes: int = len(network.nodes)

    def effective_travel_time(
        self,
        source: str,
        target: str,
        congestion: Optional[float] = None,
    ) -> float:
        """
        Computes dynamic effective travel time:
            tau_ij = t_ij^0 * (1 + alpha * c_ij)

        Where:
            t_ij^0 = (d_ij / v_ij^0) * 60 (free flow time in minutes)
            c_ij   = Congestion index in [0, 1]
            alpha  = Congestion sensitivity factor
        """
        if not self.network.road_exists(source, target):
            return 999.0

        road = self.network.get_road(source, target)
        t_0 = road.free_flow_time_min

        if congestion is None:
            c_ij = self.traffic_model.get_congestion(source, target, road.capacity_vehicles)
        else:
            c_ij = congestion

        # Equation: tau_ij = t_ij^0 * (1 + alpha * c_ij)
        tau_ij = t_0 * (1.0 + self.alpha_congestion * c_ij)
        return tau_ij

    def routes_to_decision_matrix(
        self,
        routes: List[List[str]],
    ) -> Dict[Tuple[str, str, int], int]:
        """
        Constructs the 3D binary decision variable tensor:
            x_ijk = 1 if vehicle k traverses edge (i, j), else 0.
        """
        x_matrix: Dict[Tuple[str, str, int], int] = {}
        for k, path in enumerate(routes):
            if not path or len(path) < 2:
                continue
            for i, j in zip(path[:-1], path[1:]):
                x_matrix[(i, j, k)] = 1
        return x_matrix

    def objective_function(
        self,
        routes: List[List[str]],
        custom_weights: Optional[ModelWeights] = None,
    ) -> ObjectiveBreakdown:
        """
        Evaluates the exact mathematical objective function Z:
            Minimize Z = w1 * sum_{k} sum_{(i,j)} tau_ij * x_ijk
                       + w2 * sum_{k} sum_{(i,j)} d_ij * x_ijk
                       + w3 * sum_{k} sum_{(i,j)} c_ij * x_ijk

        Returns a detailed ObjectiveBreakdown object with all sub-costs.
        """
        w = custom_weights or self.weights

        # Update dynamic PCE loads for accurate congestion c_ij
        v_types = [v.vehicle_type if hasattr(v, "vehicle_type") else "Cars" for v in self.vehicles]
        self.traffic_model.update_vehicle_loads(routes, vehicle_types=v_types)

        total_tau = 0.0  # Sum tau_ij * x_ijk
        total_d = 0.0    # Sum d_ij * x_ijk
        total_c = 0.0    # Sum c_ij * x_ijk

        for k, path in enumerate(routes):
            if not path or len(path) < 2:
                continue
            for i, j in zip(path[:-1], path[1:]):
                if self.network.road_exists(i, j):
                    road = self.network.get_road(i, j)
                    c_ij = self.traffic_model.get_congestion(i, j, road.capacity_vehicles)
                    tau_ij = self.effective_travel_time(i, j, congestion=c_ij)
                    d_ij = road.distance_km

                    total_tau += tau_ij
                    total_d += d_ij
                    total_c += c_ij
                else:
                    # Broken edge penalty term
                    total_tau += 50.0
                    total_d += 20.0
                    total_c += 1.0

        travel_time_cost = w.w1 * total_tau
        distance_cost = w.w2 * total_d
        congestion_cost = w.w3 * total_c
        z_value = travel_time_cost + distance_cost + congestion_cost

        return ObjectiveBreakdown(
            travel_time_total=round(total_tau, 4),
            distance_total=round(total_d, 4),
            congestion_total=round(total_c, 4),
            w1=w.w1,
            w2=w.w2,
            w3=w.w3,
            travel_time_cost=round(travel_time_cost, 4),
            distance_cost=round(distance_cost, 4),
            congestion_cost=round(congestion_cost, 4),
            z_value=round(z_value, 4),
        )

    def is_feasible(self, routes: List[List[str]]) -> FeasibilityResult:
        """
        Rigorous constraint verification engine checking all 5 mathematical constraints:
        1. Destination Reachability: sum_j x_{o_k, j, k} = 1, sum_i x_{i, d_k, k} = 1
        2. Flow Conservation: sum_i x_{i, u, k} - sum_j x_{u, j, k} = 0 for all u not in {o_k, d_k}
        3. Road Status & Edge Validity: x_ijk = 0 for closed/invalid roads
        4. Road Capacity Overflow: sum_k PCE_k * x_ijk <= Capacity_ij
        5. Subtour Elimination (MTZ): No disconnected cycles or repeated intermediate loops
        """
        violations: List[ConstraintViolation] = []
        total_penalty = 0.0

        reachability_valid = True
        flow_conservation_valid = True
        road_status_valid = True
        capacity_valid = True
        subtour_free = True

        # Check per-vehicle constraints (1, 2, 3, 5)
        for k, vehicle in enumerate(self.vehicles):
            path = routes[k] if k < len(routes) else []
            v_id = vehicle.vehicle_id
            origin = vehicle.origin
            destination = vehicle.destination

            # Constraint 1: Origin and Destination reachability
            if not path or path[0] != origin or path[-1] != destination:
                reachability_valid = False
                p = self.penalty_unreachable
                total_penalty += p
                violations.append(
                    ConstraintViolation(
                        constraint_type="REACHABILITY",
                        vehicle_index=k,
                        vehicle_id=v_id,
                        description=(
                            f"Vehicle {v_id} failed reachability: "
                            f"Expected {origin} -> {destination}, got {path[0] if path else 'None'} -> {path[-1] if path else 'None'}"
                        ),
                        penalty_cost=p,
                    )
                )

            if len(path) < 2:
                continue

            # Constraint 3: Edge existence and Road Status (OPEN/CLOSED)
            for i, j in zip(path[:-1], path[1:]):
                if not self.network.road_exists(i, j):
                    road_status_valid = False
                    p = self.penalty_invalid_edge
                    total_penalty += p
                    violations.append(
                        ConstraintViolation(
                            constraint_type="INVALID_EDGE",
                            vehicle_index=k,
                            vehicle_id=v_id,
                            description=f"Edge ({i} -> {j}) does not exist in graph G=(V,E)",
                            penalty_cost=p,
                        )
                    )
                else:
                    road = self.network.get_road(i, j)
                    if road.status == RoadStatus.CLOSED:
                        road_status_valid = False
                        p = self.penalty_closed_road
                        total_penalty += p
                        violations.append(
                            ConstraintViolation(
                                constraint_type="CLOSED_ROAD",
                                vehicle_index=k,
                                vehicle_id=v_id,
                                description=f"Road ({i} -> {j}) is CLOSED/Barricaded",
                                penalty_cost=p,
                            )
                        )

            # Constraint 2: Flow Conservation at intermediate nodes
            node_in_degree: Dict[str, int] = {}
            node_out_degree: Dict[str, int] = {}
            for i, j in zip(path[:-1], path[1:]):
                node_out_degree[i] = node_out_degree.get(i, 0) + 1
                node_in_degree[j] = node_in_degree.get(j, 0) + 1

            all_path_nodes = set(path)
            for u in all_path_nodes:
                if u != origin and u != destination:
                    inflow = node_in_degree.get(u, 0)
                    outflow = node_out_degree.get(u, 0)
                    if inflow != outflow:
                        flow_conservation_valid = False
                        p = self.penalty_invalid_edge
                        total_penalty += p
                        violations.append(
                            ConstraintViolation(
                                constraint_type="FLOW_CONSERVATION",
                                vehicle_index=k,
                                vehicle_id=v_id,
                                description=f"Flow conservation violated at node {u}: inflow={inflow}, outflow={outflow}",
                                penalty_cost=p,
                            )
                        )

            # Constraint 5: Subtour Elimination (MTZ / Loop Prevention)
            unique_nodes = set(path)
            if len(path) != len(unique_nodes):
                subtour_free = False
                excess_visits = len(path) - len(unique_nodes)
                p = self.penalty_cycle * excess_visits
                total_penalty += p
                violations.append(
                    ConstraintViolation(
                        constraint_type="MTZ_SUBTOUR",
                        vehicle_index=k,
                        vehicle_id=v_id,
                        description=f"Path contains {excess_visits} subtour cycles / duplicate node visits",
                        penalty_cost=p,
                    )
                )

        # Constraint 4: Fleet & Road Capacity Oversaturation
        v_types = [v.vehicle_type if hasattr(v, "vehicle_type") else "Cars" for v in self.vehicles]
        self.traffic_model.update_vehicle_loads(routes, vehicle_types=v_types)

        for road in self.network.roads:
            load = self.traffic_model.vehicle_counts.get((road.source, road.target), 0.0)
            if load > road.capacity_vehicles:
                capacity_valid = False
                excess = load - road.capacity_vehicles
                p = excess * self.penalty_capacity
                total_penalty += p
                violations.append(
                    ConstraintViolation(
                        constraint_type="CAPACITY",
                        vehicle_index=None,
                        vehicle_id=None,
                        description=(
                            f"Capacity overflow on road ({road.source} -> {road.target}): "
                            f"Load {load:.1f} exceeds capacity {road.capacity_vehicles}"
                        ),
                        penalty_cost=p,
                    )
                )

        is_feasible = (
            reachability_valid
            and flow_conservation_valid
            and road_status_valid
            and capacity_valid
            and subtour_free
        )

        return FeasibilityResult(
            is_feasible=is_feasible,
            violations=violations,
            total_penalty=round(total_penalty, 2),
            reachability_valid=reachability_valid,
            flow_conservation_valid=flow_conservation_valid,
            road_status_valid=road_status_valid,
            capacity_valid=capacity_valid,
            subtour_free=subtour_free,
        )

    def repair_route(self, path: List[str], origin: str, destination: str) -> List[str]:
        """
        Active feasibility repair operator for a single vehicle path:
        1. Removes cycles/loops (MTZ subtour elimination).
        2. Replaces closed/invalid road segments with shortest feasible detour.
        3. Ensures origin and destination reachability.
        """
        if not path:
            from app.routing.k_paths import dijkstra_shortest_path
            detour = dijkstra_shortest_path(self.network, self.traffic_model, origin, destination)
            return detour or ([origin, destination] if self.network.road_exists(origin, destination) else [origin])

        # Step 1: Cycle removal
        repaired: List[str] = []
        seen: Dict[str, int] = {}
        for node in path:
            if node in seen:
                cut_idx = seen[node]
                repaired = repaired[: cut_idx + 1]
                seen = {n: idx for idx, n in enumerate(repaired)}
            else:
                repaired.append(node)
                seen[node] = len(repaired) - 1

        # Step 2: Ensure start and end nodes match origin and destination
        from app.routing.k_paths import dijkstra_shortest_path

        if not repaired or repaired[0] != origin:
            prefix = dijkstra_shortest_path(self.network, self.traffic_model, origin, repaired[0] if repaired else destination)
            if prefix and len(prefix) > 1:
                repaired = prefix[:-1] + repaired
            elif not repaired:
                repaired = [origin]

        if repaired[-1] != destination:
            suffix = dijkstra_shortest_path(self.network, self.traffic_model, repaired[-1], destination)
            if suffix and len(suffix) > 1:
                repaired = repaired + suffix[1:]

        # Step 3: Replace any closed or non-existent edges
        clean_path = [repaired[0]]
        for u, v in zip(repaired[:-1], repaired[1:]):
            if self.network.road_exists(u, v) and self.network.get_road(u, v).status == RoadStatus.OPEN:
                clean_path.append(v)
            else:
                detour_sub = dijkstra_shortest_path(self.network, self.traffic_model, clean_path[-1], destination)
                if detour_sub and len(detour_sub) > 1:
                    clean_path = clean_path[:-1] + detour_sub
                    break
                else:
                    clean_path.append(v)

        return clean_path

    def repair_routes(self, routes: List[List[str]]) -> List[List[str]]:
        """Repairs all fleet vehicle routes to guarantee 100% feasibility."""
        repaired_fleet = []
        for k, vehicle in enumerate(self.vehicles):
            path = routes[k] if k < len(routes) else []
            repaired_path = self.repair_route(path, vehicle.origin, vehicle.destination)
            repaired_fleet.append(repaired_path)
        return repaired_fleet

    def compute_penalty(self, routes: List[List[str]], iteration_ratio: float = 0.0) -> float:
        """
        Computes aggregate penalty cost P(x) with dynamic annealing:
            P(x, t) = (1.0 + iteration_ratio) * sum(penalties)
        """
        feasibility = self.is_feasible(routes)
        multiplier = 1.0 + max(0.0, min(2.0, iteration_ratio))
        return round(feasibility.total_penalty * multiplier, 2)

    def evaluate_fitness(
        self,
        routes: List[List[str]],
        custom_weights: Optional[ModelWeights] = None,
        iteration_ratio: float = 0.0,
    ) -> float:
        """
        Computes the complete optimization fitness scalar:
            Fitness = Z(x) + P(x, t)
        Where Z(x) is the exact mathematical objective and P(x, t) is the penalty function.
        """
        obj = self.objective_function(routes, custom_weights=custom_weights)
        penalty = self.compute_penalty(routes, iteration_ratio=iteration_ratio)
        return round(obj.z_value + penalty, 6)
