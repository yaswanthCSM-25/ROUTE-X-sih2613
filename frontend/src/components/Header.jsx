import React from 'react';
import { Activity, Cpu, Sparkles, BookOpen, Layers, BarChart2 } from 'lucide-react';

export default function Header({ 
  backendOnline, 
  scenarios, 
  currentPreset, 
  onSelectPreset, 
  onOpenDeliverables,
  onOpenBatchBenchmark,
}) {
  return (
    <header style={{
      background: 'rgba(8, 12, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '14px 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        maxWidth: 1720,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {/* Branding & Problem ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          }}>
            <Cpu size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Route Planner
              </h1>
              <span className="badge badge-emerald">
                <Sparkles size={12} /> SIH26137
              </span>
              <span className="badge badge-cyan">
                Egreen Quanta
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
              Quantum-Inspired Particle Swarm Optimization (QPSO) vs. Classical Baseline
            </p>
          </div>
        </div>

        {/* Center / Scenario Quick Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Layers size={14} /> SCENARIO:
          </span>
          <div style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: 3,
            gap: 4,
          }}>
            {scenarios.map((s) => {
              const active = currentPreset === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectPreset(s.id)}
                  style={{
                    background: active ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))' : 'transparent',
                    border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                    color: active ? '#34d399' : '#94a3b8',
                    padding: '5px 12px',
                    borderRadius: 7,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Multi-Seed Batch Benchmark */}
          <button
            onClick={onOpenBatchBenchmark}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
          >
            <BarChart2 size={14} />
            <span>5-Seed Benchmark</span>
          </button>

          {/* Deliverables / Spec Button */}
          <button
            onClick={onOpenDeliverables}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
          >
            <BookOpen size={14} />
            <span>SIH26137 Spec & Deliverables</span>
          </button>

          {/* Backend Health Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.78rem',
            color: backendOnline ? '#34d399' : '#f43f5e',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#f43f5e',
              boxShadow: backendOnline ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
            }} />
            <span style={{ fontWeight: 600 }}>{backendOnline ? 'API Connected' : 'API Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
