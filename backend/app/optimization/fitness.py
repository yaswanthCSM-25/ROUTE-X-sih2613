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


def compute_fitness(
    totals: SolutionTotals,
    time_bounds: Bounds,
    distance_bounds: Bounds,
    congestion_bounds: Bounds,
    weights: Optional[dict] = None,
) -> float:
    """
    F_final = alpha * T_norm + beta * D_norm + gamma * C_norm + penalty
    """
    w = weights or DEFAULT_WEIGHTS
    t_norm = time_bounds.normalize(totals.time_total)
    d_norm = distance_bounds.normalize(totals.distance_total)
    c_norm = congestion_bounds.normalize(totals.congestion_total)

    objective = w.get("alpha", 0.4) * t_norm + w.get("beta", 0.3) * d_norm + w.get("gamma", 0.3) * c_norm
    return objective + totals.penalty_total
