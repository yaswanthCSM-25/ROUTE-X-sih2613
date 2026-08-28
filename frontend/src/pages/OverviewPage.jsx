import React from 'react';
import { Sparkles, Layers, Cpu, Compass, CheckCircle2, ShieldCheck, ArrowRight, Gauge, Activity } from 'lucide-react';

export default function OverviewPage({ onNavigate, currentPreset, backendOnline, benchmark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero Header */}
      <div className="glass-panel" style={{ padding: '32px 36px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
            <Sparkles size={14} /> SIH Problem Statement ID: 26137
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
            Egreen Quanta
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
            Software Simulation Prototype
          </span>
        </div>

        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: 14, lineHeight: 1.3 }}>
          Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization
        </h1>

        <p style={{ fontSize: '0.96rem', color: '#cbd5e1', lineHeight: 1.7, maxWidth: 1000, marginBottom: 20 }}>
          A scientific simulation and optimization platform designed for <strong>SIH26137</strong>. 
          Route Planner models transportation networks as directed graphs with coupled Bureau of Public Roads (BPR) 
          congestion dynamics, deploying <strong>Quantum-Behaved Particle Swarm Optimization (QPSO)</strong> 
          to discover system-optimal multi-vehicle routes that minimize travel time, distance, and congestion under hard operational constraints.
        </p>

        {/* Status Callout Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          padding: '16px 20px',
          background: 'rgba(8, 12, 22, 0.65)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Backend Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: backendOnline ? '#10b981' : '#f43f5e' }} />
              <strong style={{ color: backendOnline ? '#34d399' : '#f43f5e' }}>{backendOnline ? 'FastAPI Online (Port 8000)' : 'API Offline'}</strong>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Scenario</span>
            <div style={{ marginTop: 4 }}>
              <strong style={{ color: '#38bdf8' }}>{currentPreset.toUpperCase()} Preset</strong>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimization Engine</span>
            <div style={{ marginTop: 4 }}>
              <strong style={{ color: '#f8fafc' }}>QPSO (Delta-Potential Well)</strong>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Baseline Comparison</span>
            <div style={{ marginTop: 4 }}>
              <strong style={{ color: '#cbd5e1' }}>Exact Dijkstra / A* Routing</strong>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Layers of Understanding */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Compass size={20} color="#10b981" /> Three Layers of System Understanding
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: 20 }}>
          A framework for communicating the core concepts to audiences ranging from non-technical stakeholders to optimization researchers.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Level 1: 5-Year-Old Explanation */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.7)',
            borderRadius: 12,
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>Level 1</span>
              <h3 style={{ fontSize: '1.05rem', color: '#38bdf8' }}>Simple Intuition</h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              "Imagine many cars traveling across city roads. If all drivers pick the same shortest road, that road gets completely jammed and everyone gets stuck.
              Our computer program acts like a smart traffic conductor, guiding cars along different parallel roads so everyone arrives faster without traffic jams."
            </p>
          </div>

          {/* Level 2: Engineering Explanation */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.7)',
            borderRadius: 12,
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>Level 2</span>
              <h3 style={{ fontSize: '1.05rem', color: '#34d399' }}>Engineering Architecture</h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              "Route Planner models transportation networks as directed graphs $G=(V,E)$ with non-linear BPR congestion coupling.
              Classical Dijkstra routes vehicles independently without anticipating bottleneck interference.
              QPSO searches the joint multi-vehicle route space to minimize fleet-wide travel time and congestion while respecting road capacities."
            </p>
          </div>

          {/* Level 3: Mathematical Explanation */}
          <div style={{
            background: 'rgba(8, 12, 22, 0.7)',
            borderRadius: 12,
            border: '1px solid rgba(168, 85, 247, 0.25)',
            padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>Level 3</span>
              <h3 style={{ fontSize: '1.05rem', color: '#c084fc' }}>Mathematical Formulation</h3>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              A constrained combinatorial optimization problem over continuous latent particles mapped via target-guided priority heuristics.
              Particles evolve governed by a delta-potential-well wave function with Mean Best (mbest) attractors, optimizing a normalized scalarized multi-objective: 
              F(R) = w_t · T_norm + w_d · D_norm + w_c · C_norm + P(R).
            </p>
          </div>
        </div>
      </div>

      {/* Core Project Objectives Matrix */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: '1.35rem', color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Layers size={20} color="#38bdf8" /> SIH26137 Core Mandates & Verification
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: '16px 18px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.92rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> 1. Graph Network Engine
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Directed graphs storing physical road lengths, free-flow speeds, vehicle capacities, and operational status (OPEN/CLOSED).
            </p>
          </div>

          <div style={{ padding: '16px 18px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.92rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> 2. BPR Traffic Coupling
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Bureau of Public Roads non-linear delay function ($t = t_0[1 + \alpha(V/C)^\beta]$) coupled dynamically to fleet routes.
            </p>
          </div>

          <div style={{ padding: '16px 18px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.92rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> 3. QPSO Metaheuristic
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Quantum delta-potential-well position updates with $mbest$ attractor, target-guided decoding, and active cycle repair.
            </p>
          </div>

          <div style={{ padding: '16px 18px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.92rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} /> 4. Scientific Benchmarking
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Zero-fabrication comparison against classical Dijkstra/A* baselines across 5-seed Monte Carlo runs and 4 scalability stages.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <button
          onClick={() => onNavigate('simulation')}
          className="btn btn-secondary"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Simulation Studio</strong>
            <ArrowRight size={16} color="#34d399" />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Explore graph topology and toggle road closures</span>
        </button>

        <button
          onClick={() => onNavigate('math_model')}
          className="btn btn-secondary"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Mathematical Model</strong>
            <ArrowRight size={16} color="#38bdf8" />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Inspect formal equations and code mapping</span>
        </button>

        <button
          onClick={() => onNavigate('optimization')}
          className="btn btn-secondary"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Optimization Studio</strong>
            <ArrowRight size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tune swarm parameters and run live QPSO</span>
        </button>

        <button
          onClick={() => onNavigate('results')}
          className="btn btn-secondary"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Comparative Results</strong>
            <ArrowRight size={16} color="#f59e0b" />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Review Baseline vs QPSO KPI metrics</span>
        </button>
      </div>
    </div>
  );
}
