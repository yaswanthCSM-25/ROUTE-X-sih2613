import React from 'react';
import { Award, CheckCircle2, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';

export default function AboutSihPage({ info }) {
  const deliverables = info?.deliverables || [
    { id: 'DEL-01', component: 'Graph-Based Network Model', status: 'Delivered', description: 'Weighted directed/bidirectional network model with spatial coordinates and physical properties.' },
    { id: 'DEL-02', component: 'Traffic & Congestion Engine', status: 'Delivered', description: 'Stochastic road-specific congestion simulation and travel time adjustments: t_actual = t_free * (1 + alpha * (V/C)^beta).' },
    { id: 'DEL-03', component: 'Classical Dijkstra Baseline', status: 'Delivered', description: 'Reference shortest-path benchmark computing travel time, distance, and congestion.' },
    { id: 'DEL-04', component: 'QPSO Metaheuristic Engine', status: 'Delivered', description: 'Quantum delta-potential-well position updates, mbest attractor, and multi-objective normalization.' },
    { id: 'DEL-05', component: 'FastAPI REST API Services', status: 'Delivered', description: 'High-performance asynchronous backend services exposing all optimization models.' },
    { id: 'DEL-06', component: 'Interactive Web Visualizer', status: 'Delivered', description: 'Modern dark UI, traffic heatmaps, road toggle controls, and vehicle route animations.' },
    { id: 'DEL-07', component: 'Convergence & KPI Analytics', status: 'Delivered', description: 'Real-time comparative KPIs, delta badges, and SVG convergence decay charts.' },
    { id: 'DEL-08', component: 'Smart-City Scaling Presets', status: 'Delivered', description: 'Pre-configured scenarios from 9-node demo to 16-node smart-city grid and 30-node metropolitan network.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className="badge badge-emerald"><Award size={14} /> Smart India Hackathon 2024</span>
          <span className="badge badge-cyan">Problem Statement ID: 26137</span>
        </div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
          Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          padding: '14px 18px',
          background: 'rgba(8, 12, 22, 0.65)',
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.84rem',
        }}>
          <div><strong style={{ color: '#94a3b8' }}>Organization:</strong> <span style={{ color: '#f8fafc' }}>Egreen Quanta</span></div>
          <div><strong style={{ color: '#94a3b8' }}>Department:</strong> <span style={{ color: '#f8fafc' }}>Egreen Quanta</span></div>
          <div><strong style={{ color: '#94a3b8' }}>Category:</strong> <span style={{ color: '#34d399' }}>Software</span></div>
          <div><strong style={{ color: '#94a3b8' }}>Theme:</strong> <span style={{ color: '#38bdf8' }}>Transportation & Logistics</span></div>
        </div>
      </div>

      {/* Deliverables Matrix */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#38bdf8" /> Formal Expected Deliverables Table
        </h2>

        <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, background: 'rgba(8, 12, 22, 0.6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>ID</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Component</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Technical Description</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {deliverables.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: i < deliverables.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#34d399' }}>{d.id}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>{d.component}</td>
                  <td style={{ padding: '10px 14px', color: '#cbd5e1', lineHeight: 1.4 }}>{d.description}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>
                      <CheckCircle2 size={12} /> {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Limitations and Real-World Roadmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#f59e0b', marginBottom: 10 }}>
            ⚠️ Current Prototype Limitations (Scientific Honesty)
          </h3>
          <ul style={{ paddingLeft: 18, fontSize: '0.84rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Operating on synthetic graph models (9, 16, 30 nodes) rather than live OpenStreetMap streaming.</li>
            <li>Evaluates multi-vehicle origin-destination routing; full Traveling Salesperson / multi-drop customer VRP is planned for future phases.</li>
            <li>Simulation uses static snapshot equilibrium rather than continuous microscopic vehicle physics.</li>
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', marginBottom: 10 }}>
            🚀 Real-World Scaling Roadmap
          </h3>
          <ul style={{ paddingLeft: 18, fontSize: '0.84rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Direct ingestion of OpenStreetMap (OSM) GeoJSON highway graph networks.</li>
            <li>Microscopic traffic simulator integration (SUMO / TraCI bridge).</li>
            <li>Hybrid quantum annealing / QAOA execution via D-Wave Leap & IBM Quantum backends as hardware matures.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
