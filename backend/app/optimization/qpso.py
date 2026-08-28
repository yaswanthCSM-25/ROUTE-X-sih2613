"""
qpso.py — Quantum-Inspired Particle Swarm Optimization (QPSO) for Route Planner (SIH26137).

Mathematical Formulation:
    1. Local Attractor:
       p_{i,d} = phi_{i,d} * Pbest_{i,d} + (1 - phi_{i,d}) * Gbest_d,   phi ~ U(0,1)

    2. Mean Best Position (mbest):
       mbest_d = (1 / N) * sum_{i=1}^N Pbest_{i,d}

    3. Quantum Delta-Potential-Well Position Update:
       x_{i,d}(t+1) = p_{i,d} +/- beta(t) * |mbest_d - x_{i,d}(t)| * ln(1 / u_{i,d}),  u ~ U(0,1)

    4. Contraction-Expansion Coefficient (Linearly Annealed):
       beta(t) = beta_max - (t / T) * (beta_max - beta_min)
"""

import math
import random
from dataclasses import dataclass, field
from typing import Callable, List, Tuple

Position = List[float]


@dataclass
class Particle:
    position: Position
    pbest_position: Position
    pbest_fitness: float = float("inf")
    current_fitness: float = float("inf")


@dataclass
class QPSOResult:
    gbest_position: Position
    gbest_fitness: float
    convergence: List[float] = field(default_factory=list)  # best fitness per iteration
    mean_convergence: List[float] = field(default_factory=list)  # mean fitness per iteration
    diversity_history: List[float] = field(default_factory=list)  # swarm diversity
    iterations_run: int = 0


class QPSO:
    """
    Quantum-Inspired Particle Swarm Optimizer.
    """

    def __init__(
        self,
        dimensions: int,
        fitness_fn: Callable[[Position], float],
        num_particles: int = 20,
        num_iterations: int = 50,
        beta_max: float = 1.0,
        beta_min: float = 0.4,
        seed: int = 42,
    ) -> None:
        self.dimensions = dimensions
        self.fitness_fn = fitness_fn
        self.num_particles = num_particles
        self.num_iterations = num_iterations
        self.beta_max = beta_max
        self.beta_min = beta_min
        self.rng = random.Random(seed)

        self.particles: List[Particle] = []
        self.gbest_position: Position = [0.0] * dimensions
        self.gbest_fitness: float = float("inf")

    def _random_position(self) -> Position:
        return [self.rng.uniform(0.0, 1.0) for _ in range(self.dimensions)]

    def _initialize(self) -> None:
        for _ in range(self.num_particles):
            pos = self._random_position()
            fitness = self.fitness_fn(pos)
            particle = Particle(
                position=pos,
                pbest_position=list(pos),
                pbest_fitness=fitness,
                current_fitness=fitness,
            )
            self.particles.append(particle)
            if fitness < self.gbest_fitness:
                self.gbest_fitness = fitness
                self.gbest_position = list(pos)

    def _compute_mbest(self) -> Position:
        mbest = [0.0] * self.dimensions
        for particle in self.particles:
            for d in range(self.dimensions):
                mbest[d] += particle.pbest_position[d]
        return [v / self.num_particles for v in mbest]

    def _beta(self, iteration: int) -> float:
        return self.beta_max - (iteration / max(1, self.num_iterations - 1)) * (
            self.beta_max - self.beta_min
        )

    def _compute_diversity(self, mbest: Position) -> float:
        """Calculates normalized swarm spread/diversity."""
        if not self.particles or self.dimensions == 0:
            return 0.0
        total_dist = 0.0
        for p in self.particles:
            for d in range(self.dimensions):
                total_dist += abs(p.position[d] - mbest[d])
        return total_dist / (self.num_particles * self.dimensions)

    def _update_particle(self, particle: Particle, mbest: Position, beta: float) -> None:
        new_position = [0.0] * self.dimensions
        for d in range(self.dimensions):
            phi = self.rng.uniform(0.0, 1.0)
            p_id = phi * particle.pbest_position[d] + (1 - phi) * self.gbest_position[d]

            u = self.rng.uniform(1e-9, 1.0)
            sign = 1.0 if self.rng.random() > 0.5 else -1.0

            delta = beta * abs(mbest[d] - particle.position[d]) * math.log(1.0 / u)
            value = p_id + sign * delta

            # Clamp to [0, 1] continuous space
            new_position[d] = min(1.0, max(0.0, value))

        particle.position = new_position

    def run(self) -> QPSOResult:
        self._initialize()
        convergence = [self.gbest_fitness]
        mean_convergence = [
            sum(p.current_fitness for p in self.particles) / self.num_particles
        ]
        diversity_history = [self._compute_diversity(self._compute_mbest())]

        for t in range(self.num_iterations):
            beta = self._beta(t)
            mbest = self._compute_mbest()

            for particle in self.particles:
                self._update_particle(particle, mbest, beta)
                fitness = self.fitness_fn(particle.position)
                particle.current_fitness = fitness

                if fitness < particle.pbest_fitness:
                    particle.pbest_fitness = fitness
                    particle.pbest_position = list(particle.position)

                if fitness < self.gbest_fitness:
                    self.gbest_fitness = fitness
                    self.gbest_position = list(particle.position)

            convergence.append(round(self.gbest_fitness, 6))
            mean_fitness = sum(p.current_fitness for p in self.particles) / self.num_particles
            mean_convergence.append(round(mean_fitness, 6))
            diversity_history.append(round(self._compute_diversity(mbest), 6))

        return QPSOResult(
            gbest_position=self.gbest_position,
            gbest_fitness=round(self.gbest_fitness, 6),
            convergence=convergence,
            mean_convergence=mean_convergence,
            diversity_history=diversity_history,
            iterations_run=self.num_iterations,
        )
