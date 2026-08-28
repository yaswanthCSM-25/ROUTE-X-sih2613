import React from 'react';
import { Layers, Cpu, Compass, ShieldCheck, CheckCircle2, ArrowRight, GitBranch } from 'lucide-react';

export default function ArchitecturePage() {
  const pipelineSteps = [
    {
      step: '1. Graph Network Engine',
      file: 'backend/app/simulation/graph.py',
      desc: 'Directed weighted graph G=(V,E) storing distance d_e, speed limits s_e, capacities C_e, status, and 2D spatial coordinates.',
    },
    {
      step: '2. BPR Traffic Congestion Engine',
      file: 'backend/app/simulation/traffic.py',
      desc: 'Computes dynamic travel time t_e(V_e) = t_{0,e}[1 + \\alpha(V_e/C_e)^\\beta] and tracks vehicle loads across candidate routes.',
    },
    {
      step: '3. Vehicle Fleet Definition',
      file: 'backend/app/simulation/vehicles.py',
      desc: 'Generates and validates multi-vehicle origin-destination assignments across 9-node, 16-node, and 30-node network topologies.',
    },
    {
      step: '4. Continuous QPSO Swarm Optimizer',
      file: 'backend/app/optimization/qpso.py',
      desc: 'Evolves continuous particles [0, 1]^D using quantum delta-potential-well equations with mbest and local attractors.',
    },
    {
      step: '5. Target-Guided Discrete Route Decoder',
      file: 'backend/app/optimization/decoder.py',
      desc: 'Maps continuous particles to discrete paths using A*-like potential heuristics and guaranteed destination repair.',
    },
    {
      step: '6. Multi-Objective Solution Evaluator',
      file: 'backend/app/optimization/solution.py',
      desc: 'Calculates normalized multi-objective fitness F = w_t T_norm + w_d D_norm + w_c C_norm + P(R) with invariant calibration bounds.',
    },
    {
      step: '7. Classical Baseline Benchmark',
      file: 'backend/app/optimization/baseline.py',
      desc: 'Computes reference Dijkstra and A* shortest paths under identical scenario instances and evaluates under identical fitness.',
    },
    {
      step: '8. FastAPI Asynchronous Backend Services',
      file: 'backend/app/api.py',
      desc: 'High-performance REST endpoints (/api/optimize, /api/simulation/incident, /api/benchmark/batch, /api/benchmark/scalability).',
    },
    {
      step: '9. React SVG Research Dashboard',
      file: 'frontend/src/App.jsx',
      desc: '11-page technical application with BPR heatmaps, convergence charts, multi-seed statistical tables, and turn-by-turn inspectors.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-emerald"><Layers size={13} /> Systems Architecture</span>
          <span className="badge badge-cyan">Modular Pipeline</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
          End-to-End System Architecture & Data Flow
        </h1>
        <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
          Modular, decoupled scientific computing pipeline from continuous quantum metaheuristics to discrete transportation routing.
        </p>
      </div>

      {/* Pipeline Diagram Box */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#f8fafc', marginBottom: 16 }}>
          Modular Execution Pipeline
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pipelineSteps.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 18px',
                background: 'rgba(8, 12, 22, 0.65)',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>{s.step}</strong>
                  <code style={{ fontSize: '0.74rem', color: '#38bdf8' }}>{s.file}</code>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Contracts Section */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1.15rem', color: '#38bdf8', marginBottom: 14 }}>
          Core Data Contracts
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ background: 'rgba(8, 12, 22, 0.7)', padding: '16px 18px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <strong style={{ color: '#34d399', fontSize: '0.88rem' }}>ProblemDefinition Contract:</strong>
            <pre style={{ color: '#cbd5e1', fontSize: '0.76rem', marginTop: 8, fontFamily: 'JetBrains Mono' }}>
{`ProblemDefinition:
  network: RoadNetwork (Nodes, Roads)
  traffic_model: TrafficModel (BPR)
  vehicles: List[Vehicle]
  weights: Dict[str, float]
  bounds: CalibrationBounds (T, D, C)`}
            </pre>
          </div>

          <div style={{ background: 'rgba(8, 12, 22, 0.7)', padding: '16px 18px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <strong style={{ color: '#38bdf8', fontSize: '0.88rem' }}>OptimizationResult Contract:</strong>
            <pre style={{ color: '#cbd5e1', fontSize: '0.76rem', marginTop: 8, fontFamily: 'JetBrains Mono' }}>
{`OptimizationResult:
  algorithm: "qpso" | "dijkstra" | "astar"
  routes: List[RouteMetrics]
  totals: SolutionTotals (Time, Dist, Cong)
  fitness: float
  runtime_sec: float
  convergence: List[float]`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
