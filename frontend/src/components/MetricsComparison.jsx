import React from 'react';
import {
  Clock,
  MapPin,
  Gauge,
  Award,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Zap,
  Droplets,
  Leaf,
  Activity,
  Calculator,
} from 'lucide-react';

export default function MetricsComparison({ benchmark }) {
  if (!benchmark) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        Run simulation or optimization to view comprehensive physics and emissions benchmarking.
      </div>
    );
  }

  const { baseline, qpso, comparison } = benchmark;
  const qpsoMath = qpso?.mathematical_formulation || {};
  const baselineMath = baseline?.mathematical_formulation || {};

  const renderDelta = (deltaPct, invert = false) => {
    if (deltaPct === undefined || deltaPct === null) return null;
    const isGood = invert ? deltaPct > 0 : deltaPct < 0;
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

  const objZ = qpso?.objective_z || qpsoMath?.z_value || qpso?.fitness || 0.0;
  const baseZ = baseline?.objective_z || baselineMath?.z_value || baseline?.fitness || 0.0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 0. Mathematical Objective Function Z Master Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <Calculator size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                Mathematical Objective Function (Z)
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                SIH 26137 Rigorous Formulation
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
              Z = w1·Στ_ij + w2·Σd_ij + w3·Σc_ij
            </div>
          </div>
        </div>

        {/* Objective Breakdown Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {qpsoMath?.travel_time_cost !== undefined && (
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', background: 'rgba(8, 12, 22, 0.6)', padding: '6px 10px', borderRadius: 8 }}>
              <span style={{ color: '#38bdf8' }}>w1·T:</span> <strong>{qpsoMath.travel_time_cost}</strong>
            </div>
          )}
          {qpsoMath?.distance_cost !== undefined && (
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', background: 'rgba(8, 12, 22, 0.6)', padding: '6px 10px', borderRadius: 8 }}>
              <span style={{ color: '#34d399' }}>w2·D:</span> <strong>{qpsoMath.distance_cost}</strong>
            </div>
          )}
          {qpsoMath?.congestion_cost !== undefined && (
            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', background: 'rgba(8, 12, 22, 0.6)', padding: '6px 10px', borderRadius: 8 }}>
              <span style={{ color: '#f59e0b' }}>w3·C:</span> <strong>{qpsoMath.congestion_cost}</strong>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Objective Z:</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono' }}>
              {typeof objZ === 'number' ? objZ.toFixed(4) : objZ}
            </div>
          </div>

          {comparison?.objective_z_improvement_pct !== undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Improvement:</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                {comparison.objective_z_improvement_pct > 0
                  ? `+${comparison.objective_z_improvement_pct}% vs Baseline`
                  : `${comparison.objective_z_improvement_pct}% vs Baseline`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Performance Dimensions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* 1. Total Travel Time (tau_ij) */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#34d399" /> EFFECTIVE TRAVEL TIME (τ)
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

        {/* 2. Total Travel Distance (d_ij) */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="#38bdf8" /> TOTAL DISTANCE (d)
            </span>
            {renderDelta(comparison?.distance_delta_pct)}
          </div>
          <div>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
              {qpso?.distance_total_km} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>km</span>
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
            <span>Baseline Distance:</span>
            <strong style={{ color: '#94a3b8' }}>{baseline?.distance_total_km} km</strong>
          </div>
        </div>

        {/* 3. Congestion Delay & Index (c_ij) */}
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

        {/* 4. Fuel & CO2 Footprint */}
        <div className="glass-panel" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Leaf size={14} color="#10b981" /> FUEL & CO2 FOOTPRINT
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
            <span>Fuel Burned:</span>
            <strong style={{ color: '#38bdf8' }}>{qpso?.fuel_total_liters || '0.00'} L</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
