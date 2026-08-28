import React, { useState } from 'react';
import { Navigation, Sliders, AlertTriangle, ShieldCheck, Layers, RefreshCw, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import NetworkMap from '../components/NetworkMap';
import SimulationControlCenter from '../components/simulation-center/SimulationControlCenter';

export default function SimulationPage({
  network,
  traffic,
  scenarios,
  currentPreset,
  onSelectPreset,
  onToggleRoadStatus,
  fleetSize,
  onChangeFleetSize,
  vehicles,
  params,
  onChangeParams,
  onRunOptimization,
  isLoading,
  benchmark,
}) {
  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer' | 'control_center'
  const [showBaselineOverlay, setShowBaselineOverlay] = useState(true);
  const [showQpsoOverlay, setShowQpsoOverlay] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const baselineRoutes = benchmark?.routes?.baseline || [];
  const qpsoRoutes = benchmark?.routes?.qpso || [];

  const handleApplyControlCenter = (simConfig) => {
    // Pass fleet size and trigger optimization
    if (simConfig.vehicles?.count) {
      onChangeFleetSize(simConfig.vehicles.count);
    }
    onRunOptimization();
    // Switch to visualizer to see the result
    setActiveTab('visualizer');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* Simulation Environment Disclaimer & Mode Switcher Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 10,
        fontSize: '0.84rem',
        color: '#cbd5e1',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#38bdf8',
            boxShadow: '0 0 10px #38bdf8',
          }} />
          <span>
            <strong>Simulation Platform:</strong> Unified Route Planner simulation with BPR congestion dynamics & parameter control center.
          </span>
        </div>

        {/* Tab Toggle: Visualizer vs Control Center */}
        <div style={{
          display: 'flex',
          background: 'rgba(8, 12, 22, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          padding: 2,
          gap: 2,
        }}>
          <button
            onClick={() => setActiveTab('visualizer')}
            style={{
              background: activeTab === 'visualizer' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              border: activeTab === 'visualizer' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent',
              color: activeTab === 'visualizer' ? '#34d399' : '#94a3b8',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Navigation size={14} />
            <span>Map Visualizer</span>
          </button>

          <button
            onClick={() => setActiveTab('control_center')}
            style={{
              background: activeTab === 'control_center' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              border: activeTab === 'control_center' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
              color: activeTab === 'control_center' ? '#38bdf8' : '#94a3b8',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LayoutGrid size={14} />
            <span>Control Center</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Control Center */}
      {activeTab === 'control_center' && (
        <SimulationControlCenter
          onApplyAndOptimize={handleApplyControlCenter}
          isLoading={isLoading}
          fleetSize={fleetSize}
          onChangeFleetSize={onChangeFleetSize}
        />
      )}

      {/* Mode 2: Map & Visualizer */}
      {activeTab === 'visualizer' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 20 }}>
          {/* Left: Simulation Controls Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Preset Selector */}
            <div className="glass-panel" style={{ padding: '18px 20px' }}>
              <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color="#38bdf8" /> Network Scenario Preset
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {scenarios.map((s) => {
                  const active = currentPreset === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectPreset(s.id)}
                      style={{
                        background: active ? 'rgba(16, 185, 129, 0.18)' : 'rgba(8, 12, 22, 0.6)',
                        border: active ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: active ? '#34d399' : '#94a3b8',
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{s.name}</span>
                      {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Traffic Parameters */}
            <div className="glass-panel" style={{ padding: '18px 20px' }}>
              <h3 style={{ fontSize: '0.95rem', color: '#f8fafc', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={16} color="#10b981" /> Fleet & Traffic Setup
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Fleet Size */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div className="form-label">
                    <span>Fleet Size (Vehicles)</span>
                    <span className="badge badge-cyan">{fleetSize} Vehicles</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={fleetSize}
                    onChange={(e) => onChangeFleetSize(Number(e.target.value))}
                  />
                </div>

                {/* Traffic Seed */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div className="form-label">
                    <span>Background Traffic RNG Seed</span>
                    <span className="badge badge-emerald">{params.traffic_seed}</span>
                  </div>
                  <input
                    type="number"
                    className="form-control"
                    value={params.traffic_seed}
                    onChange={(e) => onChangeParams({ ...params, traffic_seed: Number(e.target.value) || 42 })}
                  />
                </div>
              </div>
            </div>

            {/* Action Trigger */}
            <button
              className="btn btn-primary"
              onClick={onRunOptimization}
              disabled={isLoading}
              style={{ padding: '12px 18px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Running Simulation...</span>
                </>
              ) : (
                <span>Re-Simulate & Optimize</span>
              )}
            </button>
          </div>

          {/* Right: Interactive Canvas Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <NetworkMap
              network={network}
              traffic={traffic}
              baselineRoutes={baselineRoutes}
              qpsoRoutes={qpsoRoutes}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={setSelectedVehicleId}
              onToggleRoadStatus={onToggleRoadStatus}
              simProgress={0}
              isSimulating={false}
              showBaselineOverlay={showBaselineOverlay}
              showQpsoOverlay={showQpsoOverlay}
              onToggleBaselineOverlay={() => setShowBaselineOverlay(!showBaselineOverlay)}
              onToggleQpsoOverlay={() => setShowQpsoOverlay(!showQpsoOverlay)}
            />

            {/* Road Segment Inspection Table */}
            <div className="glass-panel" style={{ padding: '18px 22px' }}>
              <h4 style={{ fontSize: '0.92rem', color: '#f8fafc', marginBottom: 10 }}>
                Physical Road Network Infrastructure ({network?.roads?.length || 0} Directed Segments)
              </h4>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Segment</th>
                      <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Length (km)</th>
                      <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Speed (km/h)</th>
                      <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Free Time (min)</th>
                      <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Capacity</th>
                      <th style={{ padding: '8px 12px', color: '#94a3b8' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(network?.roads || []).map((r, i) => (
                      <tr key={`${r.source}-${r.target}-${i}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#38bdf8' }}>{r.source} ➔ {r.target}</td>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{r.distance_km} km</td>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{r.speed_kmph} km/h</td>
                        <td style={{ padding: '8px 12px', color: '#34d399' }}>{r.free_time_min} min</td>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{r.capacity} veh</td>
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            onClick={() => onToggleRoadStatus(r.source, r.target)}
                            className={`badge ${r.status === 'OPEN' ? 'badge-emerald' : 'badge-amber'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                          >
                            {r.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
