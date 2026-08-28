"""Unit tests for QPSO optimizer formulation and convergence."""

from app.optimization.qpso import QPSO


def test_qpso_sphere_function():
    """Validates QPSO algorithm on standard mathematical benchmark: sphere function."""
    dim = 5

    def sphere(pos):
        return sum((x - 0.5) ** 2 for x in pos)

    optimizer = QPSO(
        dimensions=dim,
        fitness_fn=sphere,
        num_particles=20,
        num_iterations=40,
        seed=42,
    )
    result = optimizer.run()

    assert result.iterations_run == 40
    assert len(result.convergence) == 41
    # Convergence must show fitness decreasing
    assert result.convergence[-1] <= result.convergence[0]
    assert result.gbest_fitness < 0.2


def test_qpso_reproducibility():
    """Identical seeds must produce identical results."""
    def dummy_fn(pos):
        return sum(pos)

    opt1 = QPSO(dimensions=4, fitness_fn=dummy_fn, num_particles=10, num_iterations=15, seed=123)
    res1 = opt1.run()

    opt2 = QPSO(dimensions=4, fitness_fn=dummy_fn, num_particles=10, num_iterations=15, seed=123)
    res2 = opt2.run()

    assert res1.gbest_fitness == res2.gbest_fitness
    assert res1.convergence == res2.convergence
