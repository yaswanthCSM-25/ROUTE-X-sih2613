"""
pso_classic.py — Classical Velocity-Position Particle Swarm Optimization (PSO) Benchmark.

Implements standard Eberhart & Kennedy PSO:
    v_i(t+1) = w * v_i(t) + c_1 * r_1 * (pbest_i - x_i(t)) + c_2 * r_2 * (gbest - x_i(t))
    x_i(t+1) = x_i(t) + v_i(t+1)
"""

import time
from typing import Callable, List, Tuple
import numpy as np


class ClassicPSO:
    """
    Standard Continuous Velocity-Position PSO optimizer.
    """

    def __init__(
        self,
        dimensions: int,
        num_particles: int = 20,
        num_iterations: int = 35,
        w_inertia: float = 0.729,
        c1: float = 1.494,
        c2: float = 1.494,
        seed: int = 42,
    ) -> None:
        self.dimensions = dimensions
        self.num_particles = num_particles
        self.num_iterations = num_iterations
        self.w = w_inertia
        self.c1 = c1
        self.c2 = c2
        self.seed = seed
        self.rng = np.random.default_rng(seed)

        self.positions = self.rng.uniform(0.0, 1.0, (num_particles, dimensions))
        self.velocities = self.rng.uniform(-0.1, 0.1, (num_particles, dimensions))

        self.pbest_positions = self.positions.copy()
        self.pbest_fitness = np.full(num_particles, float("inf"))

        self.gbest_position = self.positions[0].copy()
        self.gbest_fitness = float("inf")
        self.convergence_history: List[float] = []

    def optimize(self, fitness_fn: Callable[[List[float]], float]) -> Tuple[List[float], float, List[float], float]:
        start_time = time.perf_counter()

        # Initial evaluation
        for i in range(self.num_particles):
            fit = fitness_fn(self.positions[i].tolist())
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
                fit = fitness_fn(self.positions[i].tolist())
                if fit < self.pbest_fitness[i]:
                    self.pbest_fitness[i] = fit
                    self.pbest_positions[i] = self.positions[i].copy()
                    if fit < self.gbest_fitness:
                        self.gbest_fitness = fit
                        self.gbest_position = self.positions[i].copy()

            self.convergence_history.append(float(self.gbest_fitness))

        runtime = round(time.perf_counter() - start_time, 3)
        return self.gbest_position.tolist(), float(self.gbest_fitness), self.convergence_history, runtime
