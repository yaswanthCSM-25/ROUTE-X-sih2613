import React from 'react';
import { X, CheckCircle2, Award, Zap, GitBranch, Layers, ShieldCheck } from 'lucide-react';

export default function DeliverablesModal({ isOpen, onClose, info }) {
  if (!isOpen) return null;

  const deliverables = info?.deliverables || [
    { id: 'DEL-01', component: 'Graph-Based Network Model', status: 'Delivered', description: 'Weighted directed/bidirectional network model with spatial coordinates and physical properties.' },
    { id: 'DEL-02', component: 'Traffic & Congestion Engine', status: 'Delivered', description: 'Stochastic road-specific congestion simulation and travel time adjustments: t_actual = t_free * (1 + c_ij).' },
    { id: 'DEL-03', component: 'Classical Dijkstra Baseline', status: 'Delivered', description: 'Reference shortest-path benchmark computing travel time, distance, and congestion.' },
    { id: 'DEL-04', component: 'QPSO Metaheuristic Engine', status: 'Delivered', description: 'Quantum delta-potential-well position updates, mbest attractor, and multi-objective normalization.' },
    { id: 'DEL-05', component: 'FastAPI REST API Services', status: 'Delivered', description: 'High-performance asynchronous backend services exposing all optimization models.' },
    { id: 'DEL-06', component: 'Interactive Web Visualizer', status: 'Delivered', description: 'Modern dark UI, traffic heatmaps, road toggle controls, and vehicle route animations.' },
    { id: 'DEL-07', component: 'Convergence & KPI Analytics', status: 'Delivered', description: 'Real-time comparative KPIs, delta badges, and SVG convergence decay charts.' },
    { id: 'DEL-08', component: 'Smart-City Scaling Presets', status: 'Delivered', description: 'Pre-configured scenarios from 9-node demo to 16-node smart-city grid.' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 24,
    }}>
      <div className="glass-panel" style={{
        maxWidth: 960,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '32px 36px',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span className="badge badge-emerald" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
            <Award size={14} /> SIH Problem Statement ID: 26137
          </span>
          <span className="badge badge-cyan" style={{ padding: '4px 10px', fontSize: '0.85rem' }}>
            Egreen Quanta
          </span>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
          Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          padding: '14px 18px',
          background: 'rgba(8, 12, 22, 0.6)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 24,
          fontSize: '0.84rem',
        }}>
          <div><strong style={{ color: '#94a3b8' }}>Organization:</strong> <span style={{ color: '#f8fafc' }}>Egreen Quanta</span></div>
          <div><strong style={{ color: '#94a3b8' }}>Department:</strong> <span style={{ color: '#f8fafc' }}>Egreen Quanta</span></div>
          <div><strong style={{ color: '#94a3b8' }}>Category:</strong> <span style={{ color: '#34d399' }}>Software</span></div>
          <div><strong style={{ color: '#94a3b8' }}>Theme:</strong> <span style={{ color: '#38bdf8' }}>Transportation & Logistics</span></div>
        </div>

        {/* Objectives Section */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '1.15rem', color: '#34d399', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} /> Project Objectives
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#cbd5e1' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 3, flexShrink: 0 }} />
              <span><strong>1. Quantum-Inspired Metaheuristic Framework:</strong> Design and execute QPSO embedding quantum-mechanical wave function / delta-potential-well principles for combinatorial routing.</span>
            </li>
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#cbd5e1' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 3, flexShrink: 0 }} />
              <span><strong>2. Multi-Objective Minimization:</strong> Jointly minimize travel time, travel distance, and traffic congestion using calibrated normalization bounds ($F = \alpha T_{norm} + \beta D_{norm} + \gamma C_{norm}$).</span>
            </li>
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#cbd5e1' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 3, flexShrink: 0 }} />
              <span><strong>3. Convergence & Benchmarking:</strong> Systematically compare against classical Dijkstra baseline with quantifiable convergence tracking and zero-fabrication metrics.</span>
            </li>
            <li style={{ display: 'flex', gap: 10, fontSize: '0.9rem', color: '#cbd5e1' }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: 3, flexShrink: 0 }} />
              <span><strong>4. Smart-City Scalability:</strong> Demonstrate robust handling of multi-vehicle fleets, dynamic road closures/accidents, and expanded urban grid topologies.</span>
            </li>
          </ul>
        </div>

        {/* Delivery Table */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.15rem', color: '#38bdf8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} /> Delivery Table (Expected Deliverables)
          </h3>
          <div style={{
            overflowX: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            background: 'rgba(8, 12, 22, 0.5)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600 }}>Component / Deliverable</th>
                  <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600 }}>Description & Formulation</th>
                  <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 600, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d, i) => (
                  <tr key={d.id} style={{
                    borderBottom: i < deliverables.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#34d399' }}>{d.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>{d.component}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1', lineHeight: 1.4 }}>{d.description}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                        <CheckCircle2 size={12} /> {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mathematical Formulation Footer Box */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: 12,
          fontSize: '0.82rem',
          color: '#cbd5e1',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: '#34d399' }}>Quantum Delta-Potential Well Equation:</strong><br />
          <code>x_i(t+1) = p_i ± α(t) · |mbest - x_i(t)| · ln(1 / u_i)</code>, where <code>mbest = (1/N) Σ Pbest_i</code> and <code>α(t) = α_max - (t/T)(α_max - α_min)</code>.
        </div>
      </div>
    </div>
  );
}
