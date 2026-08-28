"""Unit tests for QPSO optimizer formulation, convergence, and mathematical rigor (SIH26137)."""

import pytest
from app.optimization.qpso import QPSO


def test_qpso_sphere_function():
    """Validates QPSO algorithm on standard continuous benchmark: shifted sphere function."""
    dim = 5

    def sphere(pos):
        return sum((x - 0.5) ** 2 for x in pos)

    optimizer = QPSO(
        dimensions=dim,
        fitness_fn=sphere,
        num_particles=25,
        num_iterations=40,
        seed=42,
    )
    result = optimizer.run()

    assert result.iterations_run == 40
    assert len(result.convergence) == 41
    # Convergence must show fitness decreasing
    assert result.convergence[-1] <= result.convergence[0]
    assert result.gbest_fitness < 0.15


def test_qpso_global_best_monotonicity():
    """Validates that recorded global-best history is strictly monotonically non-increasing."""
    def rastrigin(pos):
        import math
        return sum(x ** 2 - 0.1 * math.cos(2 * math.pi * x) for x in pos)

    opt = QPSO(dimensions=6, fitness_fn=rastrigin, num_particles=20, num_iterations=30, seed=99)
    res = opt.run()

    for i in range(len(res.convergence) - 1):
        assert res.convergence[i] >= res.convergence[i + 1] - 1e-9


def test_qpso_reproducibility():
    """Identical random seeds must produce bit-for-bit identical optimization results."""
    def dummy_fn(pos):
        return sum((x - 0.3) ** 2 for x in pos)

    opt1 = QPSO(dimensions=4, fitness_fn=dummy_fn, num_particles=10, num_iterations=15, seed=123)
    res1 = opt1.run()

    opt2 = QPSO(dimensions=4, fitness_fn=dummy_fn, num_particles=10, num_iterations=15, seed=123)
    res2 = opt2.run()

    assert res1.gbest_fitness == res2.gbest_fitness
    assert res1.convergence == res2.convergence
    assert res1.gbest_position == res2.gbest_position


def test_qpso_diversity_history():
    """Validates that swarm diversity metrics are tracked and non-negative."""
    def simple_fn(pos):
        return sum(pos)

    opt = QPSO(dimensions=4, fitness_fn=simple_fn, num_particles=15, num_iterations=20, seed=42)
    res = opt.run()

    assert len(res.diversity_history) == 21
    assert all(d >= 0.0 for d in res.diversity_history)
