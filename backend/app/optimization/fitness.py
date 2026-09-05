"""
fitness.py — Multi-Objective fitness formulation with kinematics and environmental bounds (SIH26137).

Combines normalized objectives into scalar fitness for metaheuristic minimization:
    F = w_t * T_norm + w_d * D_norm + w_c * C_norm + w_f * Fuel_norm + Penalty

With invariant min-max normalization:
    X_norm = (X - X_min) / (X_max - X_min + epsilon)
"""

from dataclasses import dataclass
from typing import List, NamedTuple, Optional


# Default weights (Time, Distance, Congestion)
DEFAULT_WEIGHTS = {"alpha": 0.40, "beta": 0.30, "gamma": 0.30}


class SolutionTotals(NamedTuple):
    """Aggregated D_total, T_total, C_total, Fuel, CO2 across all vehicles in one candidate solution."""
    distance_total: float
    time_total: float
    congestion_total: float
    penalty_total: float
    fuel_total: float = 0.0
    co2_total: float = 0.0
    delay_total: float = 0.0
    free_flow_time_total: float = 0.0
    avg_los: str = "LOS B"
    objective_z: float = 0.0


@dataclass
class Bounds:
    min_val: float
    max_val: float

    def normalize(self, value: float) -> float:
        if self.max_val - self.min_val < 1e-9:
            return 0.0
        raw = (value - self.min_val) / (self.max_val - self.min_val)
        return min(1.0, max(0.0, raw))


def compute_bounds(values: List[float]) -> Bounds:
    if not values:
        return Bounds(0.0, 0.0)
    return Bounds(min(values), max(values))


def compute_exact_objective_z(
    travel_time_total: float,
    distance_total: float,
    congestion_total: float,
    w1: float = 0.40,
    w2: float = 0.30,
    w3: float = 0.30,
) -> float:
    """
    Mathematical Formulation Objective Z:
        Z = w1 * sum tau_ij * x_ijk + w2 * sum d_ij * x_ijk + w3 * sum c_ij * x_ijk
    """
    return (w1 * travel_time_total) + (w2 * distance_total) + (w3 * congestion_total)


def compute_fitness(
    totals: SolutionTotals,
    time_bounds: Bounds,
    distance_bounds: Bounds,
    congestion_bounds: Bounds,
    weights: Optional[dict] = None,
) -> float:
    """
    F_final = w1 * T_norm + w2 * D_norm + w3 * C_norm + penalty
    """
    w = weights or DEFAULT_WEIGHTS
    w1 = w.get("w1", w.get("alpha", 0.4))
    w2 = w.get("w2", w.get("beta", 0.3))
    w3 = w.get("w3", w.get("gamma", 0.3))

    t_norm = time_bounds.normalize(totals.time_total)
    d_norm = distance_bounds.normalize(totals.distance_total)
    c_norm = congestion_bounds.normalize(totals.congestion_total)

    objective = (w1 * t_norm) + (w2 * d_norm) + (w3 * c_norm)
    return objective + totals.penalty_total
