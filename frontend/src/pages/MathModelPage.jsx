import React from 'react';
import { BookOpen, Zap, Layers, Compass, Award, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';

export default function MathModelPage() {
  const mathSections = [
    {
      id: 'sec-graph',
      title: '1. Transportation Network Graph Representation',
      badge: 'Graph Theory',
      equation: 'G = (V, E),   e = (u, v) ∈ E,   d_e > 0,   s_e > 0,   C_e ≥ 1',
      codeSnippet: `class Road:
    source: str
    target: str
    distance_km: float
    free_flow_speed_kmph: float
    capacity_vehicles: int
    status: RoadStatus = RoadStatus.OPEN`,
      whatItMeans:
        'The physical road network is modeled as a directed, weighted graph where intersections are vertices V and one-way or bidirectional road segments are directed edges E. Each road has physical length d_e, legal speed limit s_e, structural capacity C_e, and operational status.',
      howSoftwareUsesIt:
        'Constructed in backend/app/simulation/graph.py. All search algorithms (Dijkstra, A*, and QPSO decoder) traverse this graph, querying open neighbor transitions and respecting directionality.',
    },
    {
      id: 'sec-free-flow',
      title: '2. Free-Flow Travel Time (Unit Consistency)',
      badge: 'Kinematics',
      equation: 't_0(e) = (d_e / s_e) × 60  [minutes]',
      codeSnippet: `@property
def free_flow_time_min(self) -> float:
    if self.free_flow_speed_kmph <= 0:
        return 999.0
    return (self.distance_km / self.free_flow_speed_kmph) * 60.0`,
      whatItMeans:
        'The baseline time required to traverse an empty road segment with zero traffic interference, converted rigorously from hours into minutes.',
      howSoftwareUsesIt:
        'Calculated dynamically on every Road instance in backend/app/simulation/graph.py, serving as the base scalar for BPR congestion delay multipliers.',
    },
    {
      id: 'sec-bpr',
      title: '3. Bureau of Public Roads (BPR) Traffic Model',
      badge: 'Traffic Flow Theory',
      equation: 't_e(V_e) = t_0(e) · [ 1 + α · ((V_e + V_{e, bg}) / C_e)^β ]',
      codeSnippet: `def actual_travel_time_min(self, u, v, free_flow_time_min, capacity):
    load = self.vehicle_counts.get((u, v), 0) + (self.static_congestion.get((u, v), 0.2) * capacity * 0.5)
    cap = max(1, capacity)
    bpr_factor = 1.0 + self.alpha_bpr * ((load / cap) ** self.beta_bpr)
    return free_flow_time_min * bpr_factor`,
      whatItMeans:
        'As vehicle volume V_e approaches or exceeds capacity C_e, travel time increases non-linearly. The standard parameters (alpha=0.15, beta=4.0) model realistic urban highway delay dynamics.',
      howSoftwareUsesIt:
        'Implemented in backend/app/simulation/traffic.py. When evaluating fleet routes, each vehicle path contributes dynamically to edge load V_e, causing realistic traffic friction between co-routed vehicles.',
    },
    {
      id: 'sec-fleet-coupling',
      title: '4. Dynamic Fleet Load Coupling & Decision Variables',
      badge: 'Operations Research',
      equation: 'x_{k,e} ∈ {0, 1},   V_e^fleet = Σ_k x_{k,e},   V_e^total = V_e^fleet + V_e^bg',
      codeSnippet: `def update_vehicle_loads(self, candidate_routes):
    self.vehicle_counts = defaultdict(int)
    for route in candidate_routes:
        for u, v in zip(route[:-1], route[1:]):
            self.vehicle_counts[(u, v)] += 1
    return self.vehicle_counts`,
      whatItMeans:
        'Binary variable x_{k,e} indicates whether vehicle k traverses edge e. The sum of all active fleet paths creates the real-time load on every corridor.',
      howSoftwareUsesIt:
        'Executed in backend/app/simulation/traffic.py during every candidate solution evaluation in QPSO and Baseline comparisons.',
    },
    {
      id: 'sec-multi-objective',
      title: '5. Multi-Objective Cost Formulation & Invariant Normalization',
      badge: 'Multi-Criteria Decision Analysis',
      equation: 'F(R) = w_t · [(T - T_min) / (T_max - T_min + ε)] + w_d · [(D - D_min) / (D_max - D_min + ε)] + w_c · [(C - C_min) / (C_max - C_min + ε)] + P(R)',
      codeSnippet: `def compute_fitness(totals, t_bounds, d_bounds, c_bounds, weights):
    t_norm = t_bounds.normalize(totals.time_total)
    d_norm = d_bounds.normalize(totals.distance_total)
    c_norm = c_bounds.normalize(totals.congestion_total)
    return (weights['alpha'] * t_norm +
            weights['beta'] * d_norm +
            weights['gamma'] * c_norm +
            totals.penalty_total)`,
      whatItMeans:
        'Minimizes travel time T, distance D, and congestion C simultaneously. Because units differ (minutes, km, index), each term is normalized to [0, 1] using fixed calibration bounds before weighted scalarization (w_t + w_d + w_c = 1.0).',
      howSoftwareUsesIt:
        'Computed in backend/app/optimization/fitness.py and backend/app/optimization/calibration.py. Fixed calibration ensures fitness landscapes remain invariant throughout optimization.',
    },
    {
      id: 'sec-constraints',
      title: '6. Hard & Soft Constraint Penalty Formulations',
      badge: 'Constraint Programming',
      equation: 'P(R) = λ_cap · Σ_e max(0, V_e - C_e)^2 + λ_edge · N_broken + λ_closed · N_closed + λ_unreach · N_unreach',
      codeSnippet: `if not net.road_exists(u, v):
    penalty += 100.0  # Invalid edge
if road.status == RoadStatus.CLOSED:
    penalty += 150.0  # Closed road violation
if route[-1] != destination:
    penalty += 200.0  # Unreachable destination`,
      whatItMeans:
        'Constrains solutions to strictly feasible physical paths. Closed roads, non-existent edges, and unreachable destinations incur massive penalty multipliers, rendering infeasible particles uncompetitive.',
      howSoftwareUsesIt:
        'Enforced by backend/app/routing/constraints.py and integrated directly into total fitness calculation.',
    },
    {
      id: 'sec-qpso-equations',
      title: '7. Quantum Delta-Potential-Well QPSO Position Update Equations',
      badge: 'Quantum-Inspired Metaheuristics',
      equation: 'x_{i,d}(t+1) = p_{i,d}(t) ± α(t) · |mbest_d(t) - x_{i,d}(t)| · ln(1 / u_{i,d}),   where mbest_d = (1/N) Σ Pbest_{i,d}',
      codeSnippet: `mbest = np.mean(self.pbest_positions, axis=0)
phi = np.random.uniform(0, 1, self.dimensions)
p = phi * self.pbest_positions[i] + (1 - phi) * self.gbest_position
u = np.clip(np.random.uniform(0, 1, self.dimensions), 1e-10, 1.0)
sign = np.where(np.random.uniform(0, 1, self.dimensions) < 0.5, 1.0, -1.0)
self.positions[i] = np.clip(p + sign * alpha * np.abs(mbest - self.positions[i]) * np.log(1.0 / u), 0.0, 1.0)`,
      whatItMeans:
        'In QPSO (Sun et al.), particles move in a quantum delta potential well centered at local attractor p_i. The Mean Best position mbest serves as a global swarm attractor. Contraction-expansion coefficient alpha(t) linearly anneals from 1.0 to 0.4 to transition from global exploration to local exploitation.',
      howSoftwareUsesIt:
        'Implemented in backend/app/optimization/qpso.py with numerical guards preventing division by zero or NaN explosion.',
    },
    {
      id: 'sec-decoder',
      title: '8. Target-Guided Discrete Route Decoder & Cycle Repair',
      badge: 'Combinatorial Mapping',
      equation: 'f(v) = t_actual(u, v) + h(v, dest),   rank(v) ↔ x_{i, step} ∈ [0, 1]',
      codeSnippet: `candidates.sort(key=lambda v: (
    traffic_model.actual_travel_time_min(curr, v, road.free_flow_time_min, road.capacity_vehicles) +
    euclidean_heuristic(v, destination)
))
chosen = candidates[int(latent_val * len(candidates))]
repaired = repair_path_complete(net, tm, repair_path_cycles(raw_path), destination)`,
      whatItMeans:
        'Maps continuous particle vectors [0, 1]^D to discrete graph paths. Candidates are prioritized using an A*-like potential to prevent wandering, and active loop truncation + destination completion guarantees 100% valid routes.',
      howSoftwareUsesIt:
        'Implemented in backend/app/optimization/decoder.py, resolving continuous-to-discrete combinatorial mapping.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.82rem' }}>
            <BookOpen size={14} /> Mathematical Rigor & Formal Derivations
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.82rem' }}>
            SIH26137 Foundation
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
          Mathematical Architecture & Algorithmic Formulations
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: 960 }}>
          Every equation in Route Planner represents a concrete physical or algorithmic constraint implemented directly in the simulation and optimization engines.
        </p>
      </div>

      {/* Equations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {mathSections.map((sec) => (
          <div key={sec.id} className="glass-panel" style={{ padding: '24px 28px' }}>
            {/* Section Title & Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {sec.title}
              </h2>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                {sec.badge}
              </span>
            </div>

            {/* 1. Formal Mathematical Equation Box */}
            <div style={{
              background: 'rgba(8, 12, 22, 0.85)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 10,
              padding: '16px 20px',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.95rem',
              color: '#34d399',
              marginBottom: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
                [FORMAL MATHEMATICAL EQUATION]
              </div>
              <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                {sec.equation}
              </div>
            </div>

            {/* 2. What This Means (Intuition) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4 }}>
                💡 What This Means:
              </div>
              <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {sec.whatItMeans}
              </p>
            </div>

            {/* 3. How the Software Uses It (Code Implementation) */}
            <div style={{
              background: 'rgba(8, 12, 22, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '14px 18px',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6 }}>
                ⚙️ How the Software Uses It:
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 10 }}>
                {sec.howSoftwareUsesIt}
              </p>
              <pre style={{
                background: 'rgba(3, 7, 18, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: '0.78rem',
                color: '#38bdf8',
                overflowX: 'auto',
                fontFamily: 'JetBrains Mono',
              }}>
                <code>{sec.codeSnippet}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
