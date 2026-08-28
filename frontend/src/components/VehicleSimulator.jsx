import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Activity } from 'lucide-react';

export default function VehicleSimulator({
  isSimulating,
  simProgress,
  onToggleSimulate,
  onResetSimulate,
  simSpeed,
  onChangeSpeed,
  onSeekProgress,
}) {
  return (
    <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
      {/* Left: Status & Playback */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={onToggleSimulate}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          {isSimulating ? <Pause size={15} /> : <Play size={15} />}
          <span>{isSimulating ? 'Pause Playback' : 'Simulate Fleet Movement'}</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onResetSimulate}
          title="Reset Simulation"
          style={{ padding: '8px' }}
        >
          <RotateCcw size={15} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#94a3b8' }}>
          <Activity size={14} color="#10b981" />
          <span>Progress: <strong style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{Math.round(simProgress * 100)}%</strong></span>
        </div>
      </div>

      {/* Center: Interactive Scrubber Slider */}
      <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={simProgress}
          onChange={(e) => onSeekProgress(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>

      {/* Right: Playback Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SPEED:</span>
        {[0.5, 1, 2, 4].map((spd) => (
          <button
            key={spd}
            onClick={() => onChangeSpeed(spd)}
            style={{
              background: simSpeed === spd ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: simSpeed === spd ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: simSpeed === spd ? '#34d399' : '#94a3b8',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {spd}x
          </button>
        ))}
      </div>
    </div>
  );
}
