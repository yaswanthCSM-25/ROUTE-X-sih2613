import React from 'react';
import { TrendingDown, Activity, Sparkles, ShieldCheck } from 'lucide-react';
import ConvergenceChart from '../components/ConvergenceChart';

export default function ConvergencePage({ benchmark }) {
  const convergence = benchmark?.convergence || [];
  const qpso = benchmark?.qpso;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-emerald"><TrendingDown size={13} /> Swarm Dynamics</span>
          <span className="badge badge-cyan">Convergence History</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
          QPSO Swarm Convergence & Spatial Diversity Analytics
        </h1>
        <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
          Tracks the monotonic descent of global best fitness $Gbest(t)$ across successive quantum wave iterations.
        </p>
      </div>

      {/* SVG Convergence Curve */}
      <ConvergenceChart convergence={convergence} />

      {/* Convergence Invariants & Properties */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: '0.98rem', color: '#34d399', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} /> Global Best Monotonicity
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Because the global best fitness updates conditionally only when a strictly superior particle is discovered, the convergence trajectory satisfies the monotonic invariant:
          </p>
          <div style={{ background: 'rgba(8, 12, 22, 0.8)', padding: '8px 12px', borderRadius: 6, fontFamily: 'JetBrains Mono', color: '#38bdf8', fontSize: '0.82rem', marginTop: 8 }}>
            F[t+1] ≤ F[t],  for all iterations t
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: '0.98rem', color: '#38bdf8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} /> Contraction-Expansion Phase
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            The quantum uncertainty spread shrinks according to the linear cooling schedule:
          </p>
          <div style={{ background: 'rgba(8, 12, 22, 0.8)', padding: '8px 12px', borderRadius: 6, fontFamily: 'JetBrains Mono', color: '#34d399', fontSize: '0.82rem', marginTop: 8 }}>
            alpha(t) = 1.0 - (t / T_max) · (1.0 - 0.4)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: '0.98rem', color: '#f59e0b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} /> Exploration vs Exploitation
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Early iterations emphasize global exploration via large quantum wave spreads, while late iterations focus fine-grained local search around the mean best attractor.
          </p>
        </div>
      </div>
    </div>
  );
}
