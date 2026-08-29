import React from 'react';
import { BookOpen, Zap, Layers, Compass, Award, ShieldCheck, CheckCircle2, Cpu, Droplets, Leaf, Activity } from 'lucide-react';

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
        'Constructed in backend/app/simulation/graph.py. All search algorithms (Dijkstra, A*, System Optimum MC_e, and QPSO) traverse this graph, querying open neighbor transitions and respecting directionality.',
    },
    {
      id: 'sec-bpr-akcelik',
      title: '2. BPR + Akçelik Link Performance & Queue Overflow Delay',
      badge: 'Traffic Flow Physics',
      equation: 't_e(V_e) = t_{0, e}^{\\text{eff}} · [ 1 + α · (V_e / C_{e, \\text{eff}})^β ] + Δt_{\\text{queue}}(V_e, C_{e, \\text{eff}})',
      codeSnippet: `def actual_travel_time_min(self, source, target, free_flow_time_min, capacity):
    t_0_eff = free_flow_time_min / self.weather_speed_multiplier
    vc = self.get_vc_ratio(source, target, capacity)
    bpr_factor = 1.0 + self.alpha_bpr * (vc ** self.beta_bpr)
    actual_time = t_0_eff * bpr_factor
    if vc > 1.0:
        actual_time += 1.5 * ((vc - 1.0) ** 1.5) # Akçelik queue overflow
    return round(actual_time, 2)`,
      whatItMeans:
        'As vehicle volume V_e approaches capacity C_e, travel time increases non-linearly. In oversaturated conditions (V/C > 1.0), the Akçelik delay component accurately captures queuing bottleneck physics, preventing infinite mathematical explosions while reflecting severe real-life congestion.',
      howSoftwareUsesIt:
        'Implemented in backend/app/simulation/traffic.py. Dynamically evaluated for every candidate corridor and vehicle path in the network.',
    },
    {
      id: 'sec-pce-coupling',
      title: '3. Passenger Car Equivalent (PCE) Vehicle Load Coupling',
      badge: 'Transportation Engineering',
      equation: 'V_e = Σ_k x_{k,e} · \\text{PCE}_k + V_{e, \\text{bg}},   \\text{PCE} \\in \\{1.0\\text{ (Car)}, 0.5\\text{ (Bike)}, 1.5\\text{ (Van)}, 2.5\\text{ (Lorry)}\\}',
      codeSnippet: `def update_vehicle_loads(self, routes, vehicle_types=None):
    self.vehicle_counts = {k: 0.0 for k in self.static_congestion.keys()}
    for i, path in enumerate(routes):
        v_type = vehicle_types[i] if vehicle_types else "Cars"
        pce = VEHICLE_PCE.get(v_type, 1.0)
        for u, v in zip(path[:-1], path[1:]):
            self.vehicle_counts[(u, v)] += pce
    return self.vehicle_counts`,
      whatItMeans:
        'Different vehicle categories occupy different amounts of physical road space and acceleration profiles. A heavy freight lorry equals 2.5 passenger cars, while a bike equals 0.5 cars, producing realistic road friction.',
      howSoftwareUsesIt:
        'Executed in backend/app/simulation/traffic.py and backend/app/simulation/emissions.py.',
    },
    {
      id: 'sec-vt-micro-fuel',
      title: '4. Speed-Dependent Fuel Consumption & CO2 Emissions (VT-Micro)',
      badge: 'Environmental Physics',
      equation: '\\text{Rate}_{\\text{fuel}}(v) = a_0 + a_1 v + a_2 v^2 + a_3 / v \\quad [\\text{L/100km}],   \\text{CO}_2 = \\text{Fuel} × 2.31\\text{ kg/L}',
      codeSnippet: `def compute_route_emissions(distance_km, travel_time_min, vehicle_type="Cars", vc_ratio=0.5):
    avg_speed_kmph = (distance_km / travel_time_min) * 60.0
    fuel_rate = compute_fuel_rate_l_per_100km(avg_speed_kmph, vehicle_type)
    fuel_liters = (distance_km * fuel_rate) / 100.0
    co2_kg = fuel_liters * 2.31
    return EmissionMetrics(fuel_liters=fuel_liters, co2_kg=co2_kg, avg_speed_kmph=avg_speed_kmph)`,
      whatItMeans:
        'Captures the U-shaped automotive fuel curve: heavy fuel waste during stop-and-go congestion idling (v < 15 km/h) and high-speed aerodynamic drag (v > 90 km/h), directly yielding green transportation metrics.',
      howSoftwareUsesIt:
        'Implemented in backend/app/simulation/emissions.py and reported across all simulation results and route inspection views.',
    },
    {
      id: 'sec-wardrop-so',
      title: '5. Wardrop\'s System Optimum Marginal Social Cost (MC_e)',
      badge: 'Microeconomics & Operations Research',
      equation: '\\text{MC}_e = \\frac{d}{dV_e}[V_e · t_e(V_e)] = t_{0,e}^{\\text{eff}} · [ 1 + α (β + 1) · (V_e / C_e)^β ]',
      codeSnippet: `def marginal_social_cost_min(self, source, target, free_flow_time_min, capacity):
    t_0_eff = free_flow_time_min / self.weather_speed_multiplier
    vc = self.get_vc_ratio(source, target, capacity)
    marginal_factor = 1.0 + self.alpha_bpr * (self.beta_bpr + 1.0) * (vc ** self.beta_bpr)
    return round(t_0_eff * marginal_factor, 2)`,
      whatItMeans:
        'In User Equilibrium (Dijkstra), users minimize private travel time t_e(V). In System Optimum, total social welfare is maximized by charging each vehicle its marginal delay impact on all other drivers (MC_e).',
      howSoftwareUsesIt:
        'Used in backend/app/optimization/baseline.py to generate the exact theoretical System Optimum baseline.',
    },
    {
      id: 'sec-k-corridors',
      title: '6. Yen\'s K-Shortest Paths & Candidate Corridor Combinatorial Mapping',
      badge: 'Combinatorial Graph Algorithms',
      equation: '\\text{Candidate Pool } \\mathcal{P}_k = \\{P_{k,1}, P_{k,2}, ..., P_{k,M}\\},   \\text{Jaccard Overlap}(P_1, P_2) \\le 0.75',
      codeSnippet: `pool = CorridorPool(network, K=6)
candidates = pool.get_corridors(origin, destination, traffic_model)
latent_val = max(0.0, min(0.999999, latent_vector[0]))
idx = int(math.floor(latent_val * len(candidates)))
chosen_path = candidates[idx]`,
      whatItMeans:
        'Instead of random walk turns, vehicles select among topographically diverse physical corridors (Highway Arterials, Bypass Rings, Collector Roads). This allows QPSO to perform genuine combinatorial load-balancing across the M^K fleet assignment space.',
      howSoftwareUsesIt:
        'Implemented in backend/app/routing/k_paths.py and backend/app/optimization/decoder.py.',
    },
    {
      id: 'sec-qpso-equations',
      title: '7. Quantum Delta-Potential-Well QPSO Swarm Equations',
      badge: 'Quantum-Inspired Metaheuristics',
      equation: 'x_{i,d}(t+1) = p_{i,d}(t) ± α(t) · |mbest_d(t) - x_{i,d}(t)| · ln(1 / u_{i,d}),   mbest_d = (1/N) Σ Pbest_{i,d}',
      codeSnippet: `mbest = np.mean(self.pbest_positions, axis=0)
phi = np.random.uniform(0, 1, self.dimensions)
p = phi * self.pbest_positions[i] + (1 - phi) * self.gbest_position
u = np.clip(np.random.uniform(0, 1, self.dimensions), 1e-10, 1.0)
sign = np.where(np.random.uniform(0, 1, self.dimensions) < 0.5, 1.0, -1.0)
self.positions[i] = np.clip(p + sign * alpha * np.abs(mbest - self.positions[i]) * np.log(1.0 / u), 0.0, 1.0)`,
      whatItMeans:
        'Particles move in a quantum delta potential well centered at local attractor p_i with Mean Best attractor mbest. Annealed contraction coefficient alpha(t) = 1.0 -> 0.4 ensures global exploration transitions to fine-grained exploitation.',
      howSoftwareUsesIt:
        'Implemented in backend/app/optimization/qpso.py.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="badge badge-cyan" style={{ fontSize: '0.82rem' }}>
            <BookOpen size={14} /> Transportation Science & Physics Formulations
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.82rem' }}>
            SIH26137 Rigorous Foundations
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
          Mathematical Architecture & Transportation Physics
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, maxWidth: 960 }}>
          Every equation in Route Planner represents an established transportation engineering or physics formulation (BPR-Akçelik, VT-Micro, Wardrop Marginal Cost, and QPSO Quantum Mechanics).
        </p>
      </div>

      {/* Equations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {mathSections.map((sec) => (
          <div key={sec.id} className="glass-panel" style={{ padding: '24px 28px' }}>
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
              fontSize: '0.92rem',
              color: '#34d399',
              marginBottom: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>
                [FORMAL TRANSPORTATION ENGINEERING FORMULATION]
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
                💡 Physical & Engineering Meaning:
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
                ⚙️ Backend Python Implementation:
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
