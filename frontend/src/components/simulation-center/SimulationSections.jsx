import React from 'react';
import {
  Car,
  Compass,
  TrafficCone,
  CloudSun,
  AlertTriangle,
  Cpu,
  Clock,
  Layers,
  ShieldCheck,
  Percent,
} from 'lucide-react';

/* =========================================================================
   1. 🚗 VEHICLES SECTION
   ========================================================================= */
export function VehiclesSection({ count, type, onChange, errors }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={20} color="var(--accent-cyan)" /> 1. Vehicles Configuration
        </h3>
        <span className="badge badge-cyan">{count || 10} Vehicles Active</span>
      </div>

      {/* Number of Vehicles (1 - 20) */}
      <div className="form-group">
        <div className="form-label">
          <span>Number of Vehicles (1–20)</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Limit: 20</span>
        </div>
        <input
          type="number"
          min="1"
          max="20"
          className="form-control"
          value={count !== undefined ? count : 10}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (isNaN(val)) {
              onChange('count', 1);
            } else {
              onChange('count', Math.max(1, Math.min(20, val)));
            }
          }}
          style={{ borderColor: errors?.count ? 'var(--accent-rose)' : undefined, fontSize: '0.95rem' }}
        />
        {errors?.count && <span style={{ fontSize: '0.74rem', color: 'var(--accent-rose)', marginTop: 4 }}>{errors.count}</span>}
      </div>

      {/* Vehicle Type Dropdown */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Vehicle Fleet Type</span>
        </div>
        <select
          className="form-control"
          value={type || 'Mixed'}
          onChange={(e) => onChange('type', e.target.value)}
          style={{ fontSize: '0.92rem' }}
        >
          <option value="Mixed">Mixed (Cars, Bikes, Vans, Lorries, Scooters) [DEFAULT]</option>
          <option value="Cars">Cars (Standard Passenger Vehicles)</option>
          <option value="Bikes">Bikes (Two-Wheelers / High Agility)</option>
          <option value="Lorries">Lorries (Heavy Freight / Large Size)</option>
          <option value="Scooters">Scooters (Urban Commuter)</option>
          <option value="Vans">Vans (Commercial Delivery)</option>
        </select>
      </div>
    </div>
  );
}

/* =========================================================================
   2. 🛣️ ROAD NETWORK SECTION
   ========================================================================= */
export function RoadNetworkSection({
  size,
  density,
  oneWay,
  junctions,
  roadCapacity,
  lane1Pct = 20,
  lane2Pct = 50,
  lane4Pct = 30,
  onChange,
  errors,
}) {
  // Safe lane percentage updater ensuring sum = 100%
  const handleLaneChange = (laneKey, val) => {
    const num = Math.max(0, Math.min(100, Math.round(Number(val)) || 0));
    if (laneKey === 'lane1Pct') {
      const remaining = 100 - num;
      const newL2 = Math.round(remaining * (lane2Pct / Math.max(1, (lane2Pct + lane4Pct))));
      const newL4 = remaining - newL2;
      onChange('lane1Pct', num);
      onChange('lane2Pct', newL2);
      onChange('lane4Pct', newL4);
    } else if (laneKey === 'lane2Pct') {
      const remaining = 100 - num;
      const newL1 = Math.round(remaining * (lane1Pct / Math.max(1, (lane1Pct + lane4Pct))));
      const newL4 = remaining - newL1;
      onChange('lane2Pct', num);
      onChange('lane1Pct', newL1);
      onChange('lane4Pct', newL4);
    } else {
      const remaining = 100 - num;
      const newL1 = Math.round(remaining * (lane1Pct / Math.max(1, (lane1Pct + lane2Pct))));
      const newL2 = remaining - newL1;
      onChange('lane4Pct', num);
      onChange('lane1Pct', newL1);
      onChange('lane2Pct', newL2);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Compass size={20} color="var(--accent-emerald)" /> 2. Road Network Topology
        </h3>
        <span className="badge badge-emerald">Urban Graph</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Total Network Size (20 - 100 km2) */}
        <div className="form-group">
          <div className="form-label">
            <span>Total Network Size</span>
          </div>
          <select
            className="form-control"
            value={size || 'Medium'}
            onChange={(e) => onChange('size', e.target.value)}
          >
            <option value="Low">Low (~20–40 km²)</option>
            <option value="Medium">Medium (~50–70 km²) [DEFAULT]</option>
            <option value="High">High (~80–100 km²)</option>
          </select>
        </div>

        {/* Road Density */}
        <div className="form-group">
          <div className="form-label">
            <span>Routes / Road Density</span>
          </div>
          <select
            className="form-control"
            value={density || 'Medium'}
            onChange={(e) => onChange('density', e.target.value)}
          >
            <option value="Low">Low (Fewer Corridors)</option>
            <option value="Medium">Medium (Balanced) [DEFAULT]</option>
            <option value="High">High (Dense Complex Grid)</option>
          </select>
        </div>

        {/* One-Way Roads */}
        <div className="form-group">
          <div className="form-label">
            <span>One-Way Roads</span>
          </div>
          <select
            className="form-control"
            value={oneWay || 'OFF'}
            onChange={(e) => onChange('oneWay', e.target.value)}
          >
            <option value="OFF">OFF (Bidirectional) [DEFAULT]</option>
            <option value="ON">ON (Includes One-Way Corridors)</option>
          </select>
        </div>

        {/* Junctions */}
        <div className="form-group">
          <div className="form-label">
            <span>Total Junctions</span>
          </div>
          <select
            className="form-control"
            value={junctions || 'Medium'}
            onChange={(e) => onChange('junctions', e.target.value)}
          >
            <option value="Low">Low (Direct Highway Interchanges)</option>
            <option value="Medium">Medium (Balanced Intersections) [DEFAULT]</option>
            <option value="High">High (Frequent Signalized Junctions)</option>
          </select>
        </div>
      </div>

      {/* Lane Distribution Normalization Sliders (1-Lane, 2-Lane, 4-Lane = 100%) */}
      <div style={{ background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
          <span>🛣️ Lane Distribution (Sum: {lane1Pct + lane2Pct + lane4Pct}%)</span>
          <span className="badge badge-cyan">Normalized</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: '0.76rem' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>1-Lane: <strong>{lane1Pct}%</strong></label>
            <input
              type="range"
              min="0"
              max="100"
              value={lane1Pct}
              onChange={(e) => handleLaneChange('lane1Pct', e.target.value)}
            />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>2-Lane: <strong>{lane2Pct}%</strong></label>
            <input
              type="range"
              min="0"
              max="100"
              value={lane2Pct}
              onChange={(e) => handleLaneChange('lane2Pct', e.target.value)}
            />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>4-Lane: <strong>{lane4Pct}%</strong></label>
            <input
              type="range"
              min="0"
              max="100"
              value={lane4Pct}
              onChange={(e) => handleLaneChange('lane4Pct', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. 🚦 TRAFFIC SECTION
   ========================================================================= */
export function TrafficSection({ level, pattern, timeOfDay, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrafficCone size={20} color="var(--accent-amber)" /> 3. Traffic Environment
        </h3>
        <span className="badge badge-amber">Congestion Baseline</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Traffic Level */}
        <div className="form-group">
          <div className="form-label">
            <span>Traffic Level</span>
          </div>
          <select
            className="form-control"
            value={level || 'Medium'}
            onChange={(e) => onChange('level', e.target.value)}
          >
            <option value="Low">Low (Free-Flow Speed)</option>
            <option value="Medium">Medium (Moderate Load) [DEFAULT]</option>
            <option value="High">High (Rush Hour Bottlenecks)</option>
          </select>
        </div>

        {/* Traffic Pattern */}
        <div className="form-group">
          <div className="form-label">
            <span>Traffic Pattern</span>
          </div>
          <select
            className="form-control"
            value={pattern || 'Random'}
            onChange={(e) => onChange('pattern', e.target.value)}
          >
            <option value="Random">Random Spatial Load [DEFAULT]</option>
            <option value="Equally Distributed">Equally Distributed</option>
          </select>
        </div>

        {/* Time of Day (12-hr with AM/PM) */}
        <div className="form-group">
          <div className="form-label">
            <span>Time of Day (12-hr AM/PM)</span>
          </div>
          <input
            type="text"
            className="form-control"
            value={timeOfDay || '08:00 AM'}
            onChange={(e) => onChange('timeOfDay', e.target.value)}
            placeholder="e.g. 08:00 AM, 06:30 PM"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. 🌦️ CONDITIONS SECTION
   ========================================================================= */
export function ConditionsSection({
  weather,
  roadCondition,
  goodPct = 50,
  badPct = 10,
  onChange,
}) {
  // Road condition distribution constraints: Good <= 60%, Bad <= 20%, Average = 100 - Good - Bad
  const handleGoodChange = (val) => {
    const num = Math.max(0, Math.min(60, Math.round(Number(val)) || 0));
    onChange('goodPct', num);
  };

  const handleBadChange = (val) => {
    const num = Math.max(0, Math.min(20, Math.round(Number(val)) || 0));
    onChange('badPct', num);
  };

  const avgPct = Math.max(0, 100 - goodPct - badPct);

  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudSun size={20} color="var(--accent-cyan)" /> 4. Environmental Conditions
        </h3>
        <span className="badge badge-cyan">Physical Modifiers</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Weather */}
        <div className="form-group">
          <div className="form-label">
            <span>Weather Factor</span>
          </div>
          <select
            className="form-control"
            value={weather || 'Normal'}
            onChange={(e) => onChange('weather', e.target.value)}
          >
            <option value="Normal">Normal (Dry & Clear) [DEFAULT]</option>
            <option value="Rainy">Rainy (Reduced Friction / -20% Speed)</option>
            <option value="Sunny">Sunny (High Visibility)</option>
            <option value="Windy">Windy (Moderate Drag)</option>
          </select>
        </div>

        {/* Road Condition Baseline */}
        <div className="form-group">
          <div className="form-label">
            <span>Pavement Condition Baseline</span>
          </div>
          <select
            className="form-control"
            value={roadCondition || 'Average'}
            onChange={(e) => onChange('roadCondition', e.target.value)}
          >
            <option value="Good">Good (Smooth Pavement)</option>
            <option value="Average">Average (Standard Urban Quality) [DEFAULT]</option>
            <option value="Bad">Bad (Potholes & Deterioration)</option>
          </select>
        </div>
      </div>

      {/* Road Condition Distribution Sliders */}
      <div style={{ background: 'var(--bg-input)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
          <span>🛣️ Pavement Quality Breakdown (Good ≤ 60%, Bad ≤ 20%)</span>
          <span className="badge badge-emerald">Average: {avgPct}%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: '0.76rem' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>Good (≤60%): <strong>{goodPct}%</strong></label>
            <input
              type="range"
              min="0"
              max="60"
              value={goodPct}
              onChange={(e) => handleGoodChange(e.target.value)}
            />
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>Average: <strong>{avgPct}%</strong></label>
            <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, marginTop: 7 }}>
              <div style={{ width: `${avgPct}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: 3 }} />
            </div>
          </div>
          <div>
            <label style={{ color: 'var(--text-secondary)' }}>Bad (≤20%): <strong>{badPct}%</strong></label>
            <input
              type="range"
              min="0"
              max="20"
              value={badPct}
              onChange={(e) => handleBadChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. 🚨 EVENTS / DISRUPTIONS SECTION
   ========================================================================= */
export function EventsSection({ accidents, roadClosures, constructionZones, onChange, errors }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} color="var(--accent-rose)" /> 5. Events & Road Disruptions
        </h3>
        <span className="badge badge-rose">Real-Time Incidents</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {/* Accidents (0 - 10) */}
        <div className="form-group">
          <div className="form-label">
            <span>Accidents (0–10)</span>
          </div>
          <input
            type="number"
            min="0"
            max="10"
            className="form-control"
            value={accidents !== undefined ? accidents : 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChange('accidents', isNaN(val) ? 0 : Math.max(0, Math.min(10, val)));
            }}
          />
        </div>

        {/* Road Closures (0 - 10) */}
        <div className="form-group">
          <div className="form-label">
            <span>Road Closures (0–10)</span>
          </div>
          <input
            type="number"
            min="0"
            max="10"
            className="form-control"
            value={roadClosures !== undefined ? roadClosures : 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChange('roadClosures', isNaN(val) ? 0 : Math.max(0, Math.min(10, val)));
            }}
          />
        </div>

        {/* Construction Zones (0 - 10) */}
        <div className="form-group">
          <div className="form-label">
            <span>Construction Zones (0–10)</span>
          </div>
          <input
            type="number"
            min="0"
            max="10"
            className="form-control"
            value={constructionZones !== undefined ? constructionZones : 0}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChange('constructionZones', isNaN(val) ? 0 : Math.max(0, Math.min(10, val)));
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. 🎯 OPTIMIZATION PRIORITY SECTION
   ========================================================================= */
export function OptimizationSection({ priority, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={20} color="var(--accent-cyan)" /> 6. Optimization Priority
        </h3>
        <span className="badge badge-cyan">Hero: Travel Time</span>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Objective Priority Configuration</span>
        </div>
        <select
          className="form-control"
          value={priority || 'Balanced'}
          onChange={(e) => onChange('priority', e.target.value)}
          style={{ fontSize: '0.92rem' }}
        >
          <option value="Balanced">Balanced (50% Travel Time, 25% Distance, 25% Congestion) [DEFAULT]</option>
          <option value="Travel Time">Travel Time Priority (80% Travel Time, 10% Distance, 10% Congestion) [HERO]</option>
          <option value="Distance">Distance Priority (70% Distance, 20% Travel Time, 10% Congestion)</option>
          <option value="Traffic Congestion">Traffic Congestion Priority (60% Congestion, 30% Travel Time, 10% Distance)</option>
        </select>
      </div>
    </div>
  );
}
