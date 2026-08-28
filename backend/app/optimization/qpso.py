"""
qpso.py — Quantum-inspired Particle Swarm Optimization for Route Planner.

Implements the formulation from the Q-ROUTE / Route Planner mathematical
spec:

    Local attractor:
        p_i = phi_i * Pbest_i + (1 - phi_i) * Gbest        , phi_i ~ U(0,1)

    Mean best position:
        mbest = (1/N) * sum_i Pbest_i

    Position update (quantum delta-potential-well update):
        x_i(t+1) = p_i +/- alpha * |mbest - x_i(t)| * ln(1/u_i)  , u_i ~ U(0,1)
        sign chosen with 50/50 probability

    Contraction-expansion coefficient (linearly annealed):
        alpha(t) = alpha_max - (t/T) * (alpha_max - alpha_min)

Each particle's position is a flat vector of length
    num_vehicles * steps_per_vehicle
in [0, 1] — the decoder (app.optimization.decoder) turns it into actual
graph routes, which the evaluator + constraint handler turn into a
fitness value that this optimizer minimizes.
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
    iterations_run: int = 0


class QPSO:
    def __init__(
        self,
        dimensions: int,
        fitness_fn: Callable[[Position], float],
        num_particles: int = 20,
        num_iterations: int = 50,
        alpha_max: float = 1.0,
        alpha_min: float = 0.4,
        seed: int = 42,
    ) -> None:
        """
        fitness_fn: takes a position (flat list of floats in [0,1]) and
        returns a scalar fitness (lower = better). All decode -> evaluate
        -> constrain -> normalize -> fitness logic lives OUTSIDE this
        class, in the calling code, so QPSO itself stays a general
        continuous optimizer, not something hardcoded to routing.
        """
        self.dimensions = dimensions
        self.fitness_fn = fitness_fn
        self.num_particles = num_particles
        self.num_iterations = num_iterations
        self.alpha_max = alpha_max
        self.alpha_min = alpha_min
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

    def _alpha(self, iteration: int) -> float:
        return self.alpha_max - (iteration / max(1, self.num_iterations - 1)) * (
            self.alpha_max - self.alpha_min
        )

    def _update_particle(self, particle: Particle, mbest: Position, alpha: float) -> None:
        new_position = [0.0] * self.dimensions
        for d in range(self.dimensions):
            phi = self.rng.uniform(0.0, 1.0)
            p_id = phi * particle.pbest_position[d] + (1 - phi) * self.gbest_position[d]

            u = self.rng.uniform(1e-9, 1.0)  # avoid ln(1/0)
            sign = 1.0 if self.rng.random() > 0.5 else -1.0

            delta = alpha * abs(mbest[d] - particle.position[d]) * math.log(1.0 / u)
            value = p_id + sign * delta

            # Clamp to [0,1] since the decoder interprets positions as
            # fractional indices into a candidate list.
            new_position[d] = min(1.0, max(0.0, value))

        particle.position = new_position

    def run(self) -> QPSOResult:
        self._initialize()
        convergence = [self.gbest_fitness]

        for t in range(self.num_iterations):
            alpha = self._alpha(t)
            mbest = self._compute_mbest()

            for particle in self.particles:
                self._update_particle(particle, mbest, alpha)
                fitness = self.fitness_fn(particle.position)
                particle.current_fitness = fitness

                if fitness < particle.pbest_fitness:
                    particle.pbest_fitness = fitness
                    particle.pbest_position = list(particle.position)

                if fitness < self.gbest_fitness:
                    self.gbest_fitness = fitness
                    self.gbest_position = list(particle.position)

            convergence.append(self.gbest_fitness)

        return QPSOResult(
            gbest_position=self.gbest_position,
            gbest_fitness=self.gbest_fitness,
            convergence=convergence,
            iterations_run=self.num_iterations,
        )
