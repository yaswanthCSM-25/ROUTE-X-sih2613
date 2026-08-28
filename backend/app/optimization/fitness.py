"""
fitness.py — Objective / fitness function for Route Planner.

Combines the three normalized objectives into one scalar fitness that
QPSO minimizes:

    F = alpha * T_norm + beta * D_norm + gamma * C_norm

with alpha + beta + gamma = 1, and min-max normalization:

    X_norm = (X - X_min) / (X_max - X_min)

Normalization bounds (T_min/T_max, D_min/D_max, C_min/C_max) are computed
ONCE via a calibration pass before optimization starts (see
app.optimization.calibration), not recomputed every iteration. Recomputing
them per-iteration was considered and rejected: it makes the fitness
landscape a moving target, which destabilizes QPSO's convergence (a
particle's fitness can change even if its position doesn't, just because
the rest of the swarm moved). Fixed bounds mean "lower fitness now" always
means "genuinely better route now." When min == max (degenerate
calibration sample), we define norm = 0 to avoid division by zero.
"""

from dataclasses import dataclass
from typing import List, NamedTuple


# alpha (time), beta (distance), gamma (congestion) — must sum to 1.0
DEFAULT_WEIGHTS = {"alpha": 0.40, "beta": 0.30, "gamma": 0.30}


class SolutionTotals(NamedTuple):
    """Aggregated D_total, T_total, C_total across all vehicles in one candidate solution."""
    distance_total: float
    time_total: float
    congestion_total: float
    penalty_total: float


@dataclass
class Bounds:
    min_val: float
    max_val: float

    def normalize(self, value: float) -> float:
        if self.max_val - self.min_val < 1e-9:
            return 0.0
        raw = (value - self.min_val) / (self.max_val - self.min_val)
        # Calibration bounds come from a *random sample*, not the true
        # min/max of the whole search space — QPSO can (and should)
        # find solutions better than anything in that sample. Clamp to
        # [0,1] rather than letting fitness go negative, which would
        # otherwise let an optimizer "profit" from exceeding the sample
        # instead of just being rewarded for it.
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
    weights: dict = None,
) -> float:
    """
    F_final = alpha*T_norm + beta*D_norm + gamma*C_norm + penalty

    The penalty term is added AFTER normalization and is intentionally
    left on its own scale (e.g. 50, 100) so constraint-violating
    solutions are always clearly worse than any valid one, per the
    spec's penalty-function design (Section 10).
    """
    w = weights or DEFAULT_WEIGHTS
    t_norm = time_bounds.normalize(totals.time_total)
    d_norm = distance_bounds.normalize(totals.distance_total)
    c_norm = congestion_bounds.normalize(totals.congestion_total)

    objective = w["alpha"] * t_norm + w["beta"] * d_norm + w["gamma"] * c_norm
    return objective + totals.penalty_total
