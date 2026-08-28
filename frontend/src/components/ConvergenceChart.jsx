import React, { useState, useMemo } from 'react';
import { TrendingDown, Activity, Sparkles } from 'lucide-react';

export default function ConvergenceChart({ convergence = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const chartData = useMemo(() => {
    if (!convergence || convergence.length < 2) return null;

    const minFit = Math.min(...convergence);
    const maxFit = Math.max(...convergence);
    const range = Math.max(0.0001, maxFit - minFit);

    const width = 680;
    const height = 180;
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const points = convergence.map((val, idx) => {
      const x = padding.left + (idx / (convergence.length - 1)) * innerWidth;
      const y = padding.top + (1 - (val - minFit) / range) * innerHeight;
      return { x, y, val, idx };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height - padding.bottom} L ${points[0].x.toFixed(1)} ${height - padding.bottom} Z`;

    return { width, height, points, pathD, areaD, minFit, maxFit, padding };
  }, [convergence]);

  if (!chartData) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
        Run optimization to view QPSO swarm convergence curve.
      </div>
    );
  }

  const activePoint = hoverIndex !== null ? chartData.points[hoverIndex] : chartData.points[chartData.points.length - 1];

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={18} color="#10b981" /> QPSO Swarm Convergence Analysis
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Quantum global attractor optimization progress (Best Swarm Fitness vs Iteration)
          </p>
        </div>

        {activePoint && (
          <div style={{
            background: 'rgba(8, 12, 22, 0.8)',
            padding: '4px 12px',
            borderRadius: 8,
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.78rem',
            display: 'flex',
            gap: 12,
          }}>
            <div>Iter: <strong style={{ color: '#38bdf8' }}>{activePoint.idx}</strong></div>
            <div>Fitness: <strong style={{ color: '#34d399', fontFamily: 'JetBrains Mono' }}>{activePoint.val.toFixed(4)}</strong></div>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={chartData.padding.left}
            y1={chartData.padding.top}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.padding.top}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4,4"
          />
          <line
            x1={chartData.padding.left}
            y1={chartData.height - chartData.padding.bottom}
            x2={chartData.width - chartData.padding.right}
            y2={chartData.height - chartData.padding.bottom}
            stroke="rgba(255, 255, 255, 0.12)"
          />

          {/* Area fill */}
          <path d={chartData.areaD} fill="url(#curveGradient)" />

          {/* Line stroke */}
          <path
            d={chartData.pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Interactive Hover Columns */}
          {chartData.points.map((p, idx) => (
            <g key={idx}>
              {/* Invisible wide column for easy mouse hover */}
              <rect
                x={p.x - 6}
                y={chartData.padding.top}
                width="12"
                height={chartData.height - chartData.padding.top - chartData.padding.bottom}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
              />

              {/* Dot on active point or start/end points */}
              {(hoverIndex === idx || idx === 0 || idx === chartData.points.length - 1) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === idx ? 6 : 4}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ transition: 'r 0.15s ease' }}
                />
              )}
            </g>
          ))}

          {/* Axis Labels */}
          <text
            x={chartData.padding.left - 8}
            y={chartData.padding.top + 4}
            textAnchor="end"
            fill="#64748b"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            {chartData.maxFit.toFixed(3)}
          </text>

          <text
            x={chartData.padding.left - 8}
            y={chartData.height - chartData.padding.bottom + 3}
            textAnchor="end"
            fill="#64748b"
            fontSize="10"
            fontFamily="JetBrains Mono"
          >
            {chartData.minFit.toFixed(3)}
          </text>

          <text
            x={chartData.padding.left}
            y={chartData.height - 8}
            textAnchor="start"
            fill="#64748b"
            fontSize="10"
          >
            Iter 0
          </text>

          <text
            x={chartData.width - chartData.padding.right}
            y={chartData.height - 8}
            textAnchor="end"
            fill="#64748b"
            fontSize="10"
          >
            Iter {convergence.length - 1}
          </text>
        </svg>
      </div>
    </div>
  );
}
