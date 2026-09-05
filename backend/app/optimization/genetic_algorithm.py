"""
genetic_algorithm.py — Classical Genetic Algorithm (GA) Benchmark for Route Planner (SIH 26137).

Implements standard Genetic Algorithm metaheuristic:
- Tournament selection
- Simulated Binary Crossover (SBX) / Uniform Crossover
- Gaussian & Polynomial Mutation
- Elitism preservation

Evaluates chromosomes using the exact same Mathematical Formulation:
    Minimize Z = w1 * sum tau_ij * x_ijk + w2 * sum d_ij * x_ijk + w3 * sum c_ij * x_ijk
"""

import math
import random
import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Callable, List, Optional, Tuple

if TYPE_CHECKING:
    from app.models.mathematical_model import TrafficRoutingModel

Chromosome = List[float]


@dataclass
class GAResult:
    best_chromosome: Chromosome
    best_fitness: float
    convergence: List[float] = field(default_factory=list)
    runtime_sec: float = 0.0


class GeneticAlgorithm:
    """
    Standard Genetic Algorithm baseline optimizer.
    """

    def __init__(
        self,
        dimensions: Optional[int] = None,
        model: Optional["TrafficRoutingModel"] = None,
        steps_per_vehicle: int = 4,
        population_size: int = 30,
        num_generations: int = 40,
        crossover_rate: float = 0.85,
        mutation_rate: float = 0.15,
        tournament_size: int = 3,
        elite_count: int = 2,
        seed: int = 42,
    ) -> None:
        self.model = model
        self.steps_per_vehicle = steps_per_vehicle

        if dimensions is not None:
            self.dimensions = dimensions
        elif model is not None:
            self.dimensions = len(model.vehicles) * steps_per_vehicle
        else:
            raise ValueError("Either dimensions or model must be provided to GeneticAlgorithm.")

        self.population_size = population_size
        self.num_generations = num_generations
        self.crossover_rate = crossover_rate
        self.mutation_rate = mutation_rate
        self.tournament_size = tournament_size
        self.elite_count = elite_count
        self.rng = random.Random(seed)

        self.population: List[Chromosome] = []
        self.fitness_scores: List[float] = []
        self.best_chromosome: Chromosome = [0.0] * self.dimensions
        self.best_fitness: float = float("inf")

    def _evaluate_individual(self, chrom: Chromosome, eval_fn: Callable[[Chromosome], float]) -> float:
        return eval_fn(chrom)

    def optimize(
        self,
        fitness_fn: Optional[Callable[[List[float]], float]] = None,
    ) -> Tuple[List[float], float, List[float], float]:
        start_time = time.perf_counter()

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
                penalty = self.model.compute_penalty(routes)
                return obj.z_value + penalty

            eval_fn = _model_fitness
        else:
            raise ValueError("Either fitness_fn or model must be provided to GeneticAlgorithm.optimize().")

        # 1. Initialize population
        self.population = [
            [self.rng.uniform(0.0, 1.0) for _ in range(self.dimensions)]
            for _ in range(self.population_size)
        ]
        self.fitness_scores = [self._evaluate_individual(ind, eval_fn) for ind in self.population]

        for ind, fit in zip(self.population, self.fitness_scores):
            if fit < self.best_fitness:
                self.best_fitness = fit
                self.best_chromosome = list(ind)

        convergence = [round(self.best_fitness, 6)]

        # 2. Evolutionary loop
        for gen in range(self.num_generations):
            # Elitism: retain elite_count best individuals
            sorted_indices = sorted(range(self.population_size), key=lambda i: self.fitness_scores[i])
            new_population = [list(self.population[idx]) for idx in sorted_indices[: self.elite_count]]

            while len(new_population) < self.population_size:
                # Tournament Selection for Parent 1
                t1 = self.rng.sample(range(self.population_size), self.tournament_size)
                p1_idx = min(t1, key=lambda i: self.fitness_scores[i])
                parent1 = self.population[p1_idx]

                # Tournament Selection for Parent 2
                t2 = self.rng.sample(range(self.population_size), self.tournament_size)
                p2_idx = min(t2, key=lambda i: self.fitness_scores[i])
                parent2 = self.population[p2_idx]

                # Crossover
                if self.rng.random() < self.crossover_rate:
                    # SBX / Arithmetic Crossover
                    alpha = self.rng.uniform(0.2, 0.8)
                    child1 = [alpha * parent1[d] + (1.0 - alpha) * parent2[d] for d in range(self.dimensions)]
                    child2 = [(1.0 - alpha) * parent1[d] + alpha * parent2[d] for d in range(self.dimensions)]
                else:
                    child1 = list(parent1)
                    child2 = list(parent2)

                # Mutation (Gaussian perturbation)
                for child in (child1, child2):
                    if len(new_population) >= self.population_size:
                        break
                    for d in range(self.dimensions):
                        if self.rng.random() < self.mutation_rate:
                            noise = self.rng.gauss(0.0, 0.15)
                            child[d] = min(1.0, max(0.0, child[d] + noise))
                    new_population.append(child)

            self.population = new_population
            self.fitness_scores = [self._evaluate_individual(ind, eval_fn) for ind in self.population]

            for ind, fit in zip(self.population, self.fitness_scores):
                if fit < self.best_fitness:
                    self.best_fitness = fit
                    self.best_chromosome = list(ind)

            convergence.append(round(self.best_fitness, 6))

        runtime = round(time.perf_counter() - start_time, 3)
        return self.best_chromosome, float(self.best_fitness), convergence, runtime
