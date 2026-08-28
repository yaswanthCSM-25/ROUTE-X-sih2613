import React from 'react';
import { Clock, MapPin, Gauge, Award, TrendingDown, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function MetricsComparison({ benchmark }) {
  if (!benchmark) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        Click <strong>"Run Quantum Optimization"</strong> to evaluate routes and view performance benchmarking.
      </div>
    );
  }

  const { baseline, qpso, comparison } = benchmark;

  const renderImprovementBadge = (impPct, metricLabel = '') => {
    if (impPct === undefined || impPct === null) return null;
    const isPositive = impPct > 0;
    const isZero = Math.abs(impPct) < 0.01;

    let colorClass = 'badge-emerald';
    let icon = <TrendingDown size={12} />;
    let text = `${impPct > 0 ? `+${impPct}` : impPct}%`;

    if (isZero) {
      colorClass = 'badge-cyan';
      icon = null;
      text = '0.0% (Equal)';
    } else if (!isPositive) {
      colorClass = 'badge-amber';
      icon = <TrendingUp size={12} />;
      text = `${impPct}% (Detour)`;
    }

    return (
      <span className={`badge ${ColorClass}`} style={{ fontSize: '0.72rem' }}>
        <Icon size={12} /> {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      {/* 1. Total Distance */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} color="#38bdf8" /> TOTAL DISTANCE
          </span>
          {renderDelta(comparison?.distance_delta_pct)}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
            {qpso?.distance_total_km} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>km</span>
          </span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Baseline (Dijkstra):</span>
          <strong style={{ color: '#38bdf8' }}>{baseline?.distance_total_km} km</strong>
        </div>
      </div>

      {/* 2. Total Travel Time */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="#34d399" /> TRAVEL TIME
          </span>
          {renderDelta(comparison?.time_delta_pct)}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
            {qpso?.time_total_min} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>min</span>
          </span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Baseline (Dijkstra):</span>
          <strong style={{ color: '#34d399' }}>{baseline?.time_total_min} min</strong>
        </div>
      </div>

      {/* 3. Congestion Index */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Gauge size={14} color="#f59e0b" /> CONGESTION SCORE
          </span>
          {renderDelta(comparison?.congestion_delta_pct)}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
            {qpso?.congestion_total}
          </span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Baseline (Dijkstra):</span>
          <strong style={{ color: '#f59e0b' }}>{baseline?.congestion_total}</strong>
        </div>
      </div>

      {/* 4. Objective Fitness & Quality */}
      <div className="glass-panel glass-panel-glow" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={14} /> BEST FITNESS (F)
          </span>
          <span className="badge badge-emerald">
            <ShieldCheck size={12} /> 100% Valid
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
            {qpso?.fitness?.toFixed(4) || '0.0000'}
          </span>
        </div>
        <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Swarm Runtime:</span>
          <strong style={{ color: '#f8fafc' }}>{qpso?.runtime_sec} s ({qpso?.particles}p × {qpso?.iterations}i)</strong>
        </div>
      </div>
    </div>
  );
}
