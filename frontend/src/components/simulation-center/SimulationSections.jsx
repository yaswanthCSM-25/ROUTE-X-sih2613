import React from 'react';
import { Car, Compass, TrafficCone, CloudSun, AlertTriangle, Cpu, Clock, Layers, ShieldCheck } from 'lucide-react';

/* =========================================================================
   1. 🚗 VEHICLES SECTION
   ========================================================================= */
export function VehiclesSection({ count, type, onChange, errors }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={20} color="#38bdf8" /> 1. Vehicles
        </h3>
        <span className="badge badge-cyan">{count || 10} Vehicles Active</span>
      </div>

      {/* Number of Vehicles (1 - 20) */}
      <div className="form-group">
        <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Number of Vehicles (1–20)</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Manual Input</span>
        </div>
        <input
          type="number"
          min="1"
          max="20"
          className="form-control"
          value={count !== undefined ? count : 10}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onChange('count', isNaN(val) ? 1 : Math.max(1, Math.min(20, val)));
          }}
          style={{ borderColor: errors?.count ? '#f43f5e' : undefined, fontSize: '0.95rem' }}
        />
        {errors?.count && <span style={{ fontSize: '0.74rem', color: '#f43f5e', marginTop: 4 }}>{errors.count}</span>}
      </div>

      {/* Vehicle Type Dropdown */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Vehicle Type</span>
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
  onChange,
}) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Compass size={20} color="#10b981" /> 2. Road Network
        </h3>
        <span className="badge badge-emerald">Urban Topology</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Total Network Size (20 - 100 km2 equivalent) */}
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

        {/* Number of Routes / Road Density */}
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

        {/* Total Number of Junctions */}
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

        {/* Road Width / Capacity */}
        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
          <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Road Width / Capacity</span>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>Individual road capacities assigned dynamically</span>
          </div>
          <select
            className="form-control"
            value={roadCapacity || 'Medium'}
            onChange={(e) => onChange('roadCapacity', e.target.value)}
          >
            <option value="Low">Low (Predominantly 1–2 Lane Arterials)</option>
            <option value="Medium">Medium (Mixed 1, 2, and 4-Lane Corridors) [DEFAULT]</option>
            <option value="High">High (Wide Multi-Lane Expressways)</option>
          </select>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrafficCone size={20} color="#f59e0b" /> 3. Traffic Environment
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
export function ConditionsSection({ weather, roadCondition, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudSun size={20} color="#38bdf8" /> 4. Environmental Conditions
        </h3>
        <span className="badge badge-cyan">Physical Modifiers</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {/* Weather */}
        <div className="form-group">
          <div className="form-label">
            <span>Weather</span>
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

        {/* Road Condition */}
        <div className="form-group">
          <div className="form-label">
            <span>Road Condition</span>
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
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
            *Conditions are randomly distributed across roads based on this baseline
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} color="#f43f5e" /> 5. Events & Disruptions
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
   6. 🧠 OPTIMIZATION SECTION
   ========================================================================= */
export function OptimizationSection({ priority, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
        <h3 style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={20} color="#a855f7" /> 6. Optimization Priority
        </h3>
        <span className="badge badge-purple">
          <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> ⏱️ Travel Time Centric
        </span>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Optimization Objective Priority</span>
        </div>
        <select
          className="form-control"
          value={priority || 'Balanced'}
          onChange={(e) => onChange('priority', e.target.value)}
          style={{ fontSize: '0.95rem' }}
        >
          <option value="Balanced">Balanced (Travel Time, Distance, Congestion) [DEFAULT]</option>
          <option value="Travel Time">Travel Time (Fastest Fleet Arrival ⏱️)</option>
          <option value="Distance">Distance (Shortest Path Minimization 📏)</option>
          <option value="Traffic Congestion">Traffic Congestion (Bottleneck Avoidance 🚦)</option>
        </select>
      </div>
    </div>
  );
}
