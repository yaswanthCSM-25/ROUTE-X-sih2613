"""
qpso.py — Hybrid Quantum-Inspired Particle Swarm Optimization (HQPSO) for Route Planner (SIH 26137).

Problem Statement ID: 26137
Theme: Transportation and Logistics

====================================================================================================
MATHEMATICAL FORMULATION & QUANTUM PHYSICS:
====================================================================================================

1. Local Quantum Attractor:
   In quantum state space, particle trajectories are governed by probability wave function psi(x)
   centered around the local stochastic attractor p_{i,d}:
       p_{i,d} = phi_{i,d} * Pbest_{i,d} + (1 - phi_{i,d}) * Gbest_d,   where phi_{i,d} ~ U(0, 1)

2. Swarm Mean Best Position (mbest):
   Center of quantum gravity across the entire particle swarm:
       mbest_d = (1 / N) * sum_{i=1}^N Pbest_{i,d}

3. Quantum Delta-Potential-Well Position Update:
   Derived from the time-independent Schrödinger equation for a delta potential well:
       x_{i,d}(t+1) = p_{i,d} +/- beta(t) * |mbest_d - x_{i,d}(t)| * ln(1 / u_{i,d}),  where u_{i,d} ~ U(0, 1)

4. Adaptive Contraction-Expansion Coefficient (Non-Linear Annealing with Diversity Feedback):
   Controls convergence and quantum tunneling exploration / exploitation balance:
       beta(t) = beta_min + (beta_max - beta_min) * (1 - t / T)^gamma * (1 + lambda_div * (div_target - div(t)))

5. Quantum Tunneling & Mutation Operator (Anti-Stagnation Catastrophe):
   When swarm diversity drops below threshold or stagnation is detected (Gbest unchanged for S iterations),
   quantum tunneling mutation (Cauchy/Lévy distribution) is applied to sub-optimal particles:
       x_{i,d} = clamp(p_{i,d} + Cauchy(0, sigma) * |mbest_d - x_{i,d}|, 0, 1)

6. Strong Hybridization (2-Opt & Candidate Corridor Local Search):
   Intensively applies 2-opt path rewiring, alternate corridor swaps, and waypoint perturbations
   on Gbest, Pbest, and top swarm candidates to accelerate convergence to the true global optimum.

7. Objective Function & Constraint Evaluation:
   Evaluated strictly using the Mathematical Formulation:
       Minimize Z = w1 * sum tau_ij * x_ijk + w2 * sum d_ij * x_ijk + w3 * sum c_ij * x_ijk
====================================================================================================
"""

import math
import random
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Callable, List, Optional, Tuple

if TYPE_CHECKING:
    from app.models.mathematical_model import TrafficRoutingModel

Position = List[float]


@dataclass
class Particle:
    position: Position
    pbest_position: Position
    pbest_fitness: float = float("inf")
    current_fitness: float = float("inf")
    pbest_routes: Optional[List[List[str]]] = None
    current_routes: Optional[List[List[str]]] = None


@dataclass
class QPSOResult:
    gbest_position: Position
    gbest_fitness: float
    gbest_routes: Optional[List[List[str]]] = None
    convergence: List[float] = field(default_factory=list)  # best fitness per iteration
    mean_convergence: List[float] = field(default_factory=list)  # mean fitness per iteration
    diversity_history: List[float] = field(default_factory=list)  # swarm diversity
    iterations_run: int = 0
    tunneling_events: int = 0
    local_search_improvements: int = 0


class QPSO:
    """
    Hybrid Quantum-Inspired Particle Swarm Optimizer (HQPSO).
    Integrates quantum delta-potential-well updates, adaptive contraction-expansion,
    quantum tunneling mutation, and 2-opt / corridor local search.
    """

    def __init__(
        self,
        dimensions: Optional[int] = None,
        fitness_fn: Optional[Callable[[Position], float]] = None,
        model: Optional["TrafficRoutingModel"] = None,
        steps_per_vehicle: int = 4,
        num_particles: int = 20,
        num_iterations: int = 50,
        beta_max: float = 1.0,
        beta_min: float = 0.4,
        annealing_gamma: float = 1.2,
        diversity_threshold: float = 0.035,
        stagnation_limit: int = 4,
        enable_local_search: bool = True,
        seed: int = 42,
    ) -> None:
        self.model = model
        self.steps_per_vehicle = steps_per_vehicle

        # Resolve dimensions
        if dimensions is not None:
            self.dimensions = dimensions
        elif model is not None:
            self.dimensions = len(model.vehicles) * steps_per_vehicle
        else:
            raise ValueError("Either dimensions or model must be provided to QPSO.")

        self.num_particles = num_particles
        self.num_iterations = num_iterations
        self.beta_max = beta_max
        self.beta_min = beta_min
        self.annealing_gamma = annealing_gamma
        self.diversity_threshold = diversity_threshold
        self.stagnation_limit = stagnation_limit
        self.enable_local_search = enable_local_search
        self.rng = random.Random(seed)

        # Resolve fitness evaluation function
        if fitness_fn is not None:
            self.fitness_fn = fitness_fn
        elif model is not None:
            from app.optimization.decoder import decode_all_vehicles

            def _model_fitness(position: Position) -> float:
                routes = decode_all_vehicles(
                    self.model.network,
                    self.model.traffic_model,
                    self.model.vehicles,
                    position,
                    self.steps_per_vehicle,
                )
                obj_breakdown = self.model.objective_function(routes)
                penalty = self.model.compute_penalty(routes)
                return obj_breakdown.z_value + penalty

            self.fitness_fn = _model_fitness
        else:
            raise ValueError("Either fitness_fn or model must be provided to QPSO.")

        self.particles: List[Particle] = []
        self.gbest_position: Position = [0.0] * self.dimensions
        self.gbest_fitness: float = float("inf")
        self.gbest_routes: Optional[List[List[str]]] = None
        self.tunneling_events: int = 0
        self.local_search_improvements: int = 0

    def _random_position(self) -> Position:
        return [self.rng.uniform(0.0, 1.0) for _ in range(self.dimensions)]

    def _decode_routes(self, position: Position) -> List[List[str]]:
        if self.model is None:
            return []
        from app.optimization.decoder import decode_all_vehicles
        return decode_all_vehicles(
            self.model.network,
            self.model.traffic_model,
            self.model.vehicles,
            position,
            self.steps_per_vehicle,
        )

    def _evaluate_particle(self, position: Position, iteration: int = 0) -> Tuple[float, List[List[str]]]:
        if self.model is not None:
            from app.optimization.decoder import decode_all_vehicles
            routes = decode_all_vehicles(
                self.model.network,
                self.model.traffic_model,
                self.model.vehicles,
                position,
                self.steps_per_vehicle,
            )
            # Active repair if necessary
            repaired_routes = self.model.repair_routes(routes)
            ratio = iteration / max(1, self.num_iterations)
            fit = self.model.evaluate_fitness(repaired_routes, iteration_ratio=ratio)
            return fit, repaired_routes
        else:
            return self.fitness_fn(position), []

    def _initialize(self) -> None:
        self.particles = []
        self.gbest_fitness = float("inf")
        self.gbest_position = [0.0] * self.dimensions
        self.gbest_routes = None
        self.tunneling_events = 0
        self.local_search_improvements = 0

        for _ in range(self.num_particles):
            pos = self._random_position()
            fitness, routes = self._evaluate_particle(pos, 0)
            particle = Particle(
                position=pos,
                pbest_position=list(pos),
                pbest_fitness=fitness,
                current_fitness=fitness,
                pbest_routes=routes,
                current_routes=routes,
            )
            self.particles.append(particle)
            if fitness < self.gbest_fitness:
                self.gbest_fitness = fitness
                self.gbest_position = list(pos)
                self.gbest_routes = list(routes) if routes else None

    def _compute_mbest(self) -> Position:
        """
        Calculates the mean best position across the swarm:
            mbest_d = (1 / N) * sum_{i=1}^N Pbest_{i,d}
        """
        mbest = [0.0] * self.dimensions
        for particle in self.particles:
            for d in range(self.dimensions):
                mbest[d] += particle.pbest_position[d]
        return [v / self.num_particles for v in mbest]

    def _compute_diversity(self, mbest: Position) -> float:
        """Calculates normalized quantum swarm spread/diversity."""
        if not self.particles or self.dimensions == 0:
            return 0.0
        total_dist = 0.0
        for p in self.particles:
            for d in range(self.dimensions):
                total_dist += abs(p.position[d] - mbest[d])
        return total_dist / (self.num_particles * self.dimensions)

    def _adaptive_beta(self, iteration: int, diversity: float) -> float:
        """
        Non-linear annealed contraction-expansion coefficient with diversity feedback:
            beta(t) = beta_min + (beta_max - beta_min) * (1 - t / T)^gamma
        """
        t_ratio = iteration / max(1, self.num_iterations - 1)
        base_beta = self.beta_min + (self.beta_max - self.beta_min) * ((1.0 - t_ratio) ** self.annealing_gamma)

        # Diversity feedback: boost beta slightly if diversity is critically low
        target_div = 0.10 * (1.0 - 0.7 * t_ratio)
        if diversity < target_div:
            boost = min(0.3, 0.5 * (target_div - diversity) / max(0.01, target_div))
            base_beta += boost

        return min(1.2, max(0.2, base_beta))

    def _update_particle(self, particle: Particle, mbest: Position, beta: float) -> None:
        """
        Quantum Delta-Potential-Well position update:
            p_{i,d} = phi * Pbest_{i,d} + (1 - phi) * Gbest_d
            x_{i,d}(t+1) = p_{i,d} +/- beta * |mbest_d - x_{i,d}(t)| * ln(1 / u)
        """
        new_position = [0.0] * self.dimensions
        for d in range(self.dimensions):
            phi = self.rng.uniform(0.0, 1.0)
            p_id = phi * particle.pbest_position[d] + (1.0 - phi) * self.gbest_position[d]

            u = self.rng.uniform(1e-10, 1.0)
            sign = 1.0 if self.rng.random() > 0.5 else -1.0

            delta = beta * abs(mbest[d] - particle.position[d]) * math.log(1.0 / u)
            value = p_id + sign * delta

            # Clamp to [0, 1] continuous space
            new_position[d] = min(1.0, max(0.0, value))

        particle.position = new_position

    def _quantum_tunneling_mutation(self, mbest: Position) -> None:
        """
        Applies Cauchy / Lévy flight quantum tunneling mutation to sub-optimal particles
        to escape local optima when swarm diversity drops.
        """
        # Mutate 35% of the swarm (excluding the current global best)
        num_to_mutate = max(1, int(self.num_particles * 0.35))
        candidates = sorted(self.particles, key=lambda p: p.current_fitness, reverse=True)[:num_to_mutate]

        for p in candidates:
            mutated_pos = list(p.position)
            for d in range(self.dimensions):
                if self.rng.random() < 0.40:
                    # Standard Cauchy mutation: x = p_id + Cauchy(0, 1) * |mbest - x|
                    cauchy_step = math.tan(math.pi * (self.rng.random() - 0.5))
                    cauchy_step = max(-3.0, min(3.0, cauchy_step))
                    delta = 0.25 * cauchy_step * abs(mbest[d] - p.position[d])
                    mutated_pos[d] = min(1.0, max(0.0, p.position[d] + delta))

            p.position = mutated_pos
            self.tunneling_events += 1

    def _local_search_2opt(self, routes: List[List[str]]) -> Tuple[List[List[str]], float, bool]:
        """
        Applies 2-opt edge rewiring and candidate corridor neighborhood search
        across all fleet routes to find improving path adjustments.
        """
        if self.model is None or not routes:
            return routes, float("inf"), False

        improved = False
        best_routes = [list(r) for r in routes]
        best_fit = self.model.evaluate_fitness(best_routes)

        from app.optimization.decoder import get_cached_corridors

        # 1. Candidate corridor swap search per vehicle
        for k, vehicle in enumerate(self.model.vehicles):
            candidates = get_cached_corridors(
                self.model.network, self.model.traffic_model, vehicle.origin, vehicle.destination, K=8
            )
            current_path = best_routes[k]

            for cand in candidates:
                if cand == current_path:
                    continue
                # Try replacing vehicle k's route with candidate
                trial_routes = [list(r) for r in best_routes]
                trial_routes[k] = list(cand)
                trial_fit = self.model.evaluate_fitness(trial_routes)

                if trial_fit < best_fit - 1e-5:
                    best_fit = trial_fit
                    best_routes = trial_routes
                    improved = True

            # 2. 2-opt node shortcut / bypass on current path
            path = best_routes[k]
            if len(path) >= 4:
                for i in range(len(path) - 2):
                    for j in range(i + 2, len(path)):
                        u, v = path[i], path[j]
                        if self.model.network.road_exists(u, v):
                            road = self.model.network.get_road(u, v)
                            if road.status == "OPEN":
                                # Shortcut: path[0...i] + path[j...end]
                                shortcut_path = path[: i + 1] + path[j:]
                                trial_routes = [list(r) for r in best_routes]
                                trial_routes[k] = shortcut_path
                                trial_fit = self.model.evaluate_fitness(trial_routes)

                                if trial_fit < best_fit - 1e-5:
                                    best_fit = trial_fit
                                    best_routes = trial_routes
                                    improved = True

        return best_routes, best_fit, improved

    def run(self) -> QPSOResult:
        """
        Executes the Hybrid Quantum-Inspired Particle Swarm Optimization (HQPSO) loop.
        """
        self._initialize()
        mbest = self._compute_mbest()
        curr_div = self._compute_diversity(mbest)

        convergence = [round(self.gbest_fitness, 6)]
        mean_convergence = [
            round(sum(p.current_fitness for p in self.particles) / self.num_particles, 6)
        ]
        diversity_history = [round(curr_div, 6)]

        stagnation_counter = 0
        prev_gbest = self.gbest_fitness

        for t in range(self.num_iterations):
            mbest = self._compute_mbest()
            curr_div = self._compute_diversity(mbest)
            beta = self._adaptive_beta(t, curr_div)

            # 1. Quantum Position Update
            for particle in self.particles:
                self._update_particle(particle, mbest, beta)
                fitness, routes = self._evaluate_particle(particle.position, t)
                particle.current_fitness = fitness
                particle.current_routes = routes

                if fitness < particle.pbest_fitness:
                    particle.pbest_fitness = fitness
                    particle.pbest_position = list(particle.position)
                    particle.pbest_routes = list(routes) if routes else None

                if fitness < self.gbest_fitness:
                    self.gbest_fitness = fitness
                    self.gbest_position = list(particle.position)
                    self.gbest_routes = list(routes) if routes else None

            # 2. Check for Stagnation & Quantum Tunneling Catastrophe
            if abs(self.gbest_fitness - prev_gbest) < 1e-5:
                stagnation_counter += 1
            else:
                stagnation_counter = 0
                prev_gbest = self.gbest_fitness

            if (curr_div < self.diversity_threshold or stagnation_counter >= self.stagnation_limit) and t < self.num_iterations - 5:
                self._quantum_tunneling_mutation(mbest)
                stagnation_counter = 0

            # 3. Hybrid Local Search on Gbest and Top Particles
            if self.enable_local_search and self.model is not None:
                # Apply 2-opt local search on global best
                if self.gbest_routes:
                    improved_routes, improved_fit, was_improved = self._local_search_2opt(self.gbest_routes)
                    if was_improved and improved_fit < self.gbest_fitness:
                        self.gbest_fitness = improved_fit
                        self.gbest_routes = improved_routes
                        self.local_search_improvements += 1

                        # Inverse encode improved routes into global best particle
                        from app.optimization.decoder import encode_routes_to_particle
                        self.gbest_position = encode_routes_to_particle(
                            self.gbest_routes,
                            self.model.network,
                            self.model.traffic_model,
                            self.model.vehicles,
                            self.steps_per_vehicle,
                        )

                # Light local search on top 20% of particles periodically
                if t % 3 == 0:
                    top_particles = sorted(self.particles, key=lambda p: p.current_fitness)[: max(1, self.num_particles // 5)]
                    for p in top_particles:
                        if p.current_routes:
                            p_routes, p_fit, p_improved = self._local_search_2opt(p.current_routes)
                            if p_improved and p_fit < p.pbest_fitness:
                                p.pbest_fitness = p_fit
                                p.pbest_routes = p_routes
                                p.current_fitness = p_fit
                                p.current_routes = p_routes
                                if p_fit < self.gbest_fitness:
                                    self.gbest_fitness = p_fit
                                    self.gbest_routes = p_routes
                                    self.local_search_improvements += 1

            convergence.append(round(self.gbest_fitness, 6))
            mean_fitness = sum(p.current_fitness for p in self.particles) / self.num_particles
            mean_convergence.append(round(mean_fitness, 6))
            diversity_history.append(round(self._compute_diversity(self._compute_mbest()), 6))

        return QPSOResult(
            gbest_position=self.gbest_position,
            gbest_fitness=round(self.gbest_fitness, 6),
            gbest_routes=self.gbest_routes,
            convergence=convergence,
            mean_convergence=mean_convergence,
            diversity_history=diversity_history,
            iterations_run=self.num_iterations,
            tunneling_events=self.tunneling_events,
            local_search_improvements=self.local_search_improvements,
        )
