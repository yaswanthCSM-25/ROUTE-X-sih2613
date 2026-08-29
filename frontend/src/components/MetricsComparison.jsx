import React from 'react';
import { Clock, MapPin, Gauge, Award, TrendingDown, TrendingUp, ShieldCheck, Zap, Droplets, Leaf, Activity } from 'lucide-react';

export default function MetricsComparison({ benchmark }) {
  if (!benchmark) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        Run simulation or optimization to view comprehensive physics and emissions benchmarking.
      </div>
    );
  }

  const { baseline, qpso, comparison } = benchmark;

  const renderDelta = (deltaPct) => {
    if (deltaPct === undefined || deltaPct === null) return null;
    const isGood = deltaPct < 0;
    const isZero = Math.abs(deltaPct) < 0.01;

    let colorClass = 'badge-emerald';
    let icon = <TrendingDown size={12} />;

    if (isZero) {
      colorClass = 'badge-cyan';
      icon = null;
    } else if (!isGood) {
      colorClass = 'badge-amber';
      icon = <TrendingUp size={12} />;
    }

    return (
      <span className={`badge ${colorClass}`} style={{ fontSize: '0.72rem' }}>
        {icon} {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {/* 1. Total Travel Time */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="#34d399" /> TRAVEL TIME
          </span>
          {renderDelta(comparison?.time_delta_pct)}
        </div>
        <div>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>
            {qpso?.time_total_min} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>min</span>
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Baseline ({baseline?.method?.toUpperCase() || 'DIJKSTRA'}):</span>
          <strong style={{ color: '#38bdf8' }}>{baseline?.time_total_min} min</strong>
        </div>
      </div>

      {/* 2. Congestion Delay */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={14} color="#f59e0b" /> CONGESTION DELAY
          </span>
          {comparison?.delay_improvement_pct !== undefined && (
            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
              {comparison.delay_improvement_pct > 0 ? `+${comparison.delay_improvement_pct}%` : `${comparison.delay_improvement_pct}%`}
            </span>
          )}
        </div>
        <div>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
            {qpso?.delay_total_min || '0.0'} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>min</span>
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Free-Flow Baseline:</span>
          <strong style={{ color: '#34d399' }}>{qpso?.free_flow_time_total_min || '0.0'} min</strong>
        </div>
      </div>

      {/* 3. Fuel Consumption */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Droplets size={14} color="#38bdf8" /> FUEL BURNED
          </span>
          <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
            VT-Micro Physics
          </span>
        </div>
        <div>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
            {qpso?.fuel_total_liters || '0.00'} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>L</span>
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Baseline Fuel:</span>
          <strong style={{ color: '#94a3b8' }}>{baseline?.fuel_total_liters || '0.00'} L</strong>
        </div>
      </div>

      {/* 4. CO2 Footprint & LOS */}
      <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={14} color="#10b981" /> CO2 & SERVICE LEVEL
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
            {qpso?.avg_los || 'LOS B'}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
            {qpso?.co2_total_kg || '0.00'} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>kg CO2</span>
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <span>Fitness Score (F):</span>
          <strong style={{ color: '#34d399', fontFamily: 'JetBrains Mono' }}>{qpso?.fitness?.toFixed(4) || '0.0000'}</strong>
        </div>
      </div>
    </div>
  );
}
