"""
pso_classic.py — Classical Velocity-Position Particle Swarm Optimization (PSO) Benchmark (SIH 26137).

Implements standard Eberhart & Kennedy PSO:
    v_i(t+1) = w * v_i(t) + c_1 * r_1 * (pbest_i - x_i(t)) + c_2 * r_2 * (gbest - x_i(t))
    x_i(t+1) = x_i(t) + v_i(t+1)

Evaluates particles using the same Mathematical Formulation:
    Minimize Z = w1 * sum tau_ij * x_ijk + w2 * sum d_ij * x_ijk + w3 * sum c_ij * x_ijk
"""

import time
from typing import TYPE_CHECKING, Callable, List, Optional, Tuple
import numpy as np

if TYPE_CHECKING:
    from app.models.mathematical_model import TrafficRoutingModel


class ClassicPSO:
    """
    Standard Continuous Velocity-Position PSO optimizer benchmark.
    """

    def __init__(
        self,
        dimensions: Optional[int] = None,
        model: Optional["TrafficRoutingModel"] = None,
        steps_per_vehicle: int = 4,
        num_particles: int = 20,
        num_iterations: int = 35,
        w_inertia: float = 0.729,
        c1: float = 1.494,
        c2: float = 1.494,
        seed: int = 42,
    ) -> None:
        self.model = model
        self.steps_per_vehicle = steps_per_vehicle

        if dimensions is not None:
            self.dimensions = dimensions
        elif model is not None:
            self.dimensions = len(model.vehicles) * steps_per_vehicle
        else:
            raise ValueError("Either dimensions or model must be provided to ClassicPSO.")

        self.num_particles = num_particles
        self.num_iterations = num_iterations
        self.w = w_inertia
        self.c1 = c1
        self.c2 = c2
        self.seed = seed
        self.rng = np.random.default_rng(seed)

        self.positions = self.rng.uniform(0.0, 1.0, (num_particles, self.dimensions))
        self.velocities = self.rng.uniform(-0.1, 0.1, (num_particles, self.dimensions))

        self.pbest_positions = self.positions.copy()
        self.pbest_fitness = np.full(num_particles, float("inf"))

        self.gbest_position = self.positions[0].copy()
        self.gbest_fitness = float("inf")
        self.convergence_history: List[float] = []

    def optimize(
        self,
        fitness_fn: Optional[Callable[[List[float]], float]] = None,
    ) -> Tuple[List[float], float, List[float], float]:
        start_time = time.perf_counter()

        # Resolve fitness function
        if fitness_fn is not None:
            eval_fn = fitness_fn
        elif self.model is not None:
            from app.optimization.decoder import decode_all_vehicles

            def _model_fitness(pos: List[float]) -> float:
                routes = decode_all_vehicles(
                    self.model.network,
                    self.model.traffic_model,
                    self.model.vehicles,
                    pos,
                    self.steps_per_vehicle,
                )
                obj = self.model.objective_function(routes)
                feasibility = self.model.is_feasible(routes)
                return obj.z_value + feasibility.total_penalty

            eval_fn = _model_fitness
        else:
            raise ValueError("Either fitness_fn or model must be provided to optimize().")

        # Initial evaluation
        for i in range(self.num_particles):
            fit = eval_fn(self.positions[i].tolist())
            self.pbest_fitness[i] = fit
            if fit < self.gbest_fitness:
                self.gbest_fitness = fit
                self.gbest_position = self.positions[i].copy()

        self.convergence_history.append(float(self.gbest_fitness))

        # Iterations
        for _ in range(self.num_iterations):
            r1 = self.rng.uniform(0.0, 1.0, (self.num_particles, self.dimensions))
            r2 = self.rng.uniform(0.0, 1.0, (self.num_particles, self.dimensions))

            # Velocity update
            self.velocities = (
                self.w * self.velocities
                + self.c1 * r1 * (self.pbest_positions - self.positions)
                + self.c2 * r2 * (self.gbest_position - self.positions)
            )
            # Velocity clamping
            self.velocities = np.clip(self.velocities, -0.2, 0.2)

            # Position update
            self.positions = np.clip(self.positions + self.velocities, 0.0, 1.0)

            for i in range(self.num_particles):
                fit = eval_fn(self.positions[i].tolist())
                if fit < self.pbest_fitness[i]:
                    self.pbest_fitness[i] = fit
                    self.pbest_positions[i] = self.positions[i].copy()
                    if fit < self.gbest_fitness:
                        self.gbest_fitness = fit
                        self.gbest_position = self.positions[i].copy()

            self.convergence_history.append(float(self.gbest_fitness))

        runtime = round(time.perf_counter() - start_time, 3)
        return self.gbest_position.tolist(), float(self.gbest_fitness), self.convergence_history, runtime
