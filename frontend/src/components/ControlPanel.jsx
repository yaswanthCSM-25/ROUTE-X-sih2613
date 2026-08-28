import React, { useState } from 'react';
import { Play, Sliders, Users, Plus, Trash2, Zap, Sparkles, RefreshCw, Compass } from 'lucide-react';

export default function ControlPanel({
  params,
  onChangeParams,
  weights,
  onChangeWeights,
  vehicles,
  onAddVehicle,
  onRemoveVehicle,
  onUpdateVehicle,
  availableNodes = [],
  onRunOptimization,
  isLoading,
  elapsedTime,
}) {
  const [activeTab, setActiveTab] = useState('optimizer'); // 'optimizer' | 'weights' | 'fleet'

  // Quick weight presets
  const applyWeightPreset = (alpha, beta, gamma) => {
    onChangeWeights({ alpha, beta, gamma });
  };

  const totalWeight = weights.alpha + weights.beta + weights.gamma;
  const alphaPct = Math.round((weights.alpha / totalWeight) * 100);
  const betaPct = Math.round((weights.beta / totalWeight) * 100);
  const gammaPct = 100 - alphaPct - betaPct;

  return (
    <div className="glass-panel" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={18} color="#10b981" /> Optimization Studio
        </h3>
        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>QPSO Engine</span>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        background: 'rgba(8, 12, 22, 0.6)',
        borderRadius: 10,
        padding: 3,
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <button
          onClick={() => setActiveTab('optimizer')}
          style={{
            background: activeTab === 'optimizer' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeTab === 'optimizer' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
            color: activeTab === 'optimizer' ? '#34d399' : '#94a3b8',
            padding: '6px 0',
            fontSize: '0.76rem',
            fontWeight: 600,
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          Swarm
        </button>
        <button
          onClick={() => setActiveTab('weights')}
          style={{
            background: activeTab === 'weights' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeTab === 'weights' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
            color: activeTab === 'weights' ? '#34d399' : '#94a3b8',
            padding: '6px 0',
            fontSize: '0.76rem',
            fontWeight: 600,
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          Weights
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          style={{
            background: activeTab === 'fleet' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeTab === 'fleet' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
            color: activeTab === 'fleet' ? '#34d399' : '#94a3b8',
            padding: '6px 0',
            fontSize: '0.76rem',
            fontWeight: 600,
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          Fleet ({vehicles.length})
        </button>
      </div>

      {/* Tab 1: Swarm Parameters */}
      {activeTab === 'optimizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Swarm Size (Particles) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Swarm Particles (N)</span>
              <span className="badge badge-emerald">{params.num_particles} particles</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={params.num_particles}
              onChange={(e) => onChangeParams({ ...params, num_particles: Number(e.target.value) })}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
              <span>10 (Fast)</span>
              <span>60 (Thorough)</span>
            </div>
          </div>

          {/* Max Iterations */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Optimization Iterations (T)</span>
              <span className="badge badge-cyan">{params.num_iterations} iter</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              step="10"
              value={params.num_iterations}
              onChange={(e) => onChangeParams({ ...params, num_iterations: Number(e.target.value) })}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
              <span>20</span>
              <span>120</span>
            </div>
          </div>

          {/* Traffic Random Seed */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Traffic RNG Seed</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>seed={params.traffic_seed}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                className="form-control"
                style={{ flex: 1 }}
                value={params.traffic_seed}
                onChange={(e) => onChangeParams({ ...params, traffic_seed: Number(e.target.value) || 42 })}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onChangeParams({ ...params, traffic_seed: Math.floor(Math.random() * 900) + 10 })}
                title="Randomize Traffic"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Objective Weights */}
      {activeTab === 'weights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => applyWeightPreset(0.4, 0.3, 0.3)}
              style={{ fontSize: '0.72rem' }}
            >
              Default (4:3:3)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => applyWeightPreset(0.7, 0.15, 0.15)}
              style={{ fontSize: '0.72rem' }}
            >
              ⚡ Time Critical
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => applyWeightPreset(0.15, 0.7, 0.15)}
              style={{ fontSize: '0.72rem' }}
            >
              📍 Min Distance
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => applyWeightPreset(0.15, 0.15, 0.7)}
              style={{ fontSize: '0.72rem' }}
            >
              🟢 Avoid Traffic
            </button>
          </div>

          {/* Time Weight (alpha) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Time Weight (α)</span>
              <span className="badge badge-cyan">{alphaPct}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.9"
              step="0.05"
              value={weights.alpha}
              onChange={(e) => onChangeWeights({ ...weights, alpha: Number(e.target.value) })}
            />
          </div>

          {/* Distance Weight (beta) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Distance Weight (β)</span>
              <span className="badge badge-emerald">{betaPct}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.9"
              step="0.05"
              value={weights.beta}
              onChange={(e) => onChangeWeights({ ...weights, beta: Number(e.target.value) })}
            />
          </div>

          {/* Congestion Weight (gamma) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Congestion Weight (γ)</span>
              <span className="badge badge-amber">{gammaPct}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.9"
              step="0.05"
              value={weights.gamma}
              onChange={(e) => onChangeWeights({ ...weights, gamma: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Vehicle Fleet Manager */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {vehicles.map((v, idx) => (
            <div
              key={v.vehicle_id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(8, 12, 22, 0.7)',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#34d399', width: 32 }}>
                {v.vehicle_id}
              </span>

              {/* Origin */}
              <select
                className="form-control"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                value={v.origin}
                onChange={(e) => onUpdateVehicle(idx, { ...v, origin: e.target.value })}
              >
                {availableNodes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>➔</span>

              {/* Destination */}
              <select
                className="form-control"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                value={v.destination}
                onChange={(e) => onUpdateVehicle(idx, { ...v, destination: e.target.value })}
              >
                {availableNodes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              {/* Remove */}
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: 4, color: '#f43f5e', marginLeft: 'auto' }}
                onClick={() => onRemoveVehicle(idx)}
                disabled={vehicles.length <= 1}
                title="Remove Vehicle"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <button
            className="btn btn-secondary btn-sm"
            onClick={onAddVehicle}
            style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Plus size={14} /> Add Vehicle
          </button>
        </div>
      )}

      {/* Master Action Trigger */}
      <button
        className="btn btn-primary"
        onClick={onRunOptimization}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '1rem',
          fontWeight: 700,
          marginTop: 6,
        }}
      >
        {isLoading ? (
          <>
            <RefreshCw size={18} className="animate-pulse-glow" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Optimizing Swarm ({elapsedTime}s)...</span>
          </>
        ) : (
          <>
            <Zap size={18} />
            <span>Run Quantum Optimization</span>
          </>
        )}
      </button>
    </div>
  );
}
