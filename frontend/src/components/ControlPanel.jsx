import React, { useState } from 'react';
import { Sliders, Users, Plus, Trash2, Zap, RefreshCw, Layers, Compass, Gauge } from 'lucide-react';

export default function ControlPanel({
  params,
  onChangeParams,
  weights,
  onChangeWeights,
  vehicles,
  fleetSize,
  onChangeFleetSize,
  baselineMethod,
  onChangeBaselineMethod,
  bprParams,
  onChangeBprParams,
  onAddVehicle,
  onRemoveVehicle,
  onUpdateVehicle,
  availableNodes = [],
  onRunOptimization,
  isLoading,
  elapsedTime,
}) {
  const [activeTab, setActiveTab] = useState('scenario'); // 'scenario' | 'optimizer' | 'weights' | 'fleet'

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
          <Sliders size={18} color="#10b981" /> Simulation Studio
        </h3>
        <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>QPSO Engine</span>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        background: 'rgba(8, 12, 22, 0.6)',
        borderRadius: 10,
        padding: 3,
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <button
          onClick={() => setActiveTab('scenario')}
          style={{
            background: activeTab === 'scenario' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeTab === 'scenario' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
            color: activeTab === 'scenario' ? '#34d399' : '#94a3b8',
            padding: '6px 0',
            fontSize: '0.74rem',
            fontWeight: 600,
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          Scenario
        </button>
        <button
          onClick={() => setActiveTab('optimizer')}
          style={{
            background: activeTab === 'optimizer' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            border: activeTab === 'optimizer' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
            color: activeTab === 'optimizer' ? '#34d399' : '#94a3b8',
            padding: '6px 0',
            fontSize: '0.74rem',
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
            fontSize: '0.74rem',
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
            fontSize: '0.74rem',
            fontWeight: 600,
            borderRadius: 7,
            cursor: 'pointer',
          }}
        >
          Fleet ({vehicles.length})
        </button>
      </div>

      {/* Tab 0: Scenario Builder */}
      {activeTab === 'scenario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Fleet Size Slider */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Fleet Scalability</span>
              <span className="badge badge-cyan">{fleetSize || vehicles.length} vehicles</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={fleetSize || vehicles.length}
              onChange={(e) => onChangeFleetSize(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
              <span>5 (MVP Demo)</span>
              <span>50 (Smart City)</span>
            </div>
          </div>

          {/* Baseline Routing Method */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Baseline Algorithm</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onChangeBaselineMethod('dijkstra')}
                style={{
                  fontSize: '0.75rem',
                  border: baselineMethod === 'dijkstra' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  background: baselineMethod === 'dijkstra' ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: baselineMethod === 'dijkstra' ? '#34d399' : '#94a3b8',
                }}
              >
                Dijkstra Shortest Path
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onChangeBaselineMethod('astar')}
                style={{
                  fontSize: '0.75rem',
                  border: baselineMethod === 'astar' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  background: baselineMethod === 'astar' ? 'rgba(6,182,212,0.15)' : 'transparent',
                  color: baselineMethod === 'astar' ? '#38bdf8' : '#94a3b8',
                }}
              >
                A* (Spatial Heuristic)
              </button>
            </div>
          </div>

          {/* BPR Alpha / Beta */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>BPR Congestion Coefficient (α={bprParams.alpha}, β={bprParams.beta})</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={bprParams.alpha}
                onChange={(e) => onChangeBprParams({ ...bprParams, alpha: parseFloat(e.target.value) })}
                title="BPR Alpha"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Swarm Parameters */}
      {activeTab === 'optimizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick Presets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => applyWeightPreset(0.4, 0.3, 0.3)}
              style={{ fontSize: '0.72rem' }}
            >
              Balanced (4:3:3)
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
              🟢 Avoid Congestion
            </button>
          </div>

          {/* Time Weight (alpha) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Time Weight (w_t)</span>
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
              <span>Distance Weight (w_d)</span>
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
              <span>Congestion Weight (w_c)</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
          {vehicles.map((v, idx) => (
            <div
              key={v.vehicle_id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(8, 12, 22, 0.7)',
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#34d399', width: 34 }}>
                {v.vehicle_id}
              </span>

              {/* Origin */}
              <select
                className="form-control"
                style={{ padding: '3px 6px', fontSize: '0.76rem' }}
                value={v.origin}
                onChange={(e) => onUpdateVehicle(idx, { ...v, origin: e.target.value })}
              >
                {availableNodes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <span style={{ color: '#64748b', fontSize: '0.75rem' }}>➔</span>

              {/* Destination */}
              <select
                className="form-control"
                style={{ padding: '3px 6px', fontSize: '0.76rem' }}
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
                style={{ padding: 3, color: '#f43f5e', marginLeft: 'auto' }}
                onClick={() => onRemoveVehicle(idx)}
                disabled={vehicles.length <= 1}
                title="Remove Vehicle"
              >
                <Trash2 size={12} />
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
          padding: '13px',
          fontSize: '0.96rem',
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {isLoading ? (
          <>
            <RefreshCw size={17} className="animate-pulse-glow" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Running QPSO ({elapsedTime}s)...</span>
          </>
        ) : (
          <>
            <Zap size={17} />
            <span>Run Quantum Optimization</span>
          </>
        )}
      </button>
    </div>
  );
}
