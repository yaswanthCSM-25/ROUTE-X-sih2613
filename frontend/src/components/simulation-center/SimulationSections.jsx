import React from 'react';
import { Sliders, Car, AlertTriangle, CloudSun, Shield, Compass } from 'lucide-react';

export function VehiclesSection({ count, type, onChange, errors }) {
  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Car size={18} color="#38bdf8" /> Vehicle Fleet Setup
      </h3>

      <div className="form-group">
        <div className="form-label">
          <span>Number of Fleet Vehicles (1–20)</span>
          <span className="badge badge-cyan">{count || 0} Veh</span>
        </div>
        <input
          type="number"
          min="1"
          max="20"
          className="form-control"
          value={count || ''}
          onChange={(e) => onChange('count', parseInt(e.target.value, 10) || 1)}
          style={{ borderColor: errors?.count ? '#f43f5e' : undefined }}
        />
        {errors?.count && <span style={{ fontSize: '0.74rem', color: '#f43f5e', marginTop: 4 }}>{errors.count}</span>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Vehicle Composition Type</span>
        </div>
        <select
          className="form-control"
          value={type}
          onChange={(e) => onChange('type', e.target.value)}
        >
          <option value="Mixed">Mixed Fleet (Cars + Commercial)</option>
          <option value="Cars">Standard Passenger Cars</option>
          <option value="Bikes">Two-Wheelers / Fast Transit</option>
          <option value="Lorries">Heavy Freight & Trucks</option>
          <option value="Emergency">Priority Emergency Vehicles</option>
        </select>
      </div>
    </div>
  );
}

export function RoadNetworkSection({
  sizeKm2,
  density,
  oneWayRoutes,
  junctions,
  laneDistribution,
  onChange,
  errors,
  maxOneWayRoutes,
}) {
  const handleLaneChange = (laneField, valueStr) => {
    let newValue = parseFloat(valueStr);
    if (isNaN(newValue)) newValue = 0;
    if (newValue < 0) newValue = 0;
    if (newValue > 100) newValue = 100;

    const remaining = 100 - newValue;
    const keys = ['oneLanePercentage', 'twoLanePercentage', 'fourLanePercentage'];
    const otherFields = keys.filter((k) => k !== laneField);

    const otherVal1 = laneDistribution[otherFields[0]];
    const otherVal2 = laneDistribution[otherFields[1]];
    const sumOthers = otherVal1 + otherVal2;

    let newOtherVal1 = 0;
    let newOtherVal2 = 0;

    if (sumOthers > 0) {
      newOtherVal1 = (otherVal1 / sumOthers) * remaining;
      newOtherVal2 = (otherVal2 / sumOthers) * remaining;
    } else {
      newOtherVal1 = remaining / 2;
      newOtherVal2 = remaining / 2;
    }

    newValue = Math.round(newValue * 100) / 100;
    newOtherVal1 = Math.round(newOtherVal1 * 100) / 100;
    newOtherVal2 = Math.round((100 - newValue - newOtherVal1) * 100) / 100;

    onChange('laneDistribution', {
      [laneField]: newValue,
      [otherFields[0]]: newOtherVal1,
      [otherFields[1]]: newOtherVal2,
    });
  };

  const isTotalValid = Math.abs(
    (laneDistribution.oneLanePercentage + laneDistribution.twoLanePercentage + laneDistribution.fourLanePercentage) - 100
  ) < 0.05;

  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Compass size={18} color="#10b981" /> Road Network Topology
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <div className="form-label">
            <span>Network Area (20–100 km²)</span>
          </div>
          <input
            type="number"
            min="20"
            max="100"
            className="form-control"
            value={sizeKm2 !== undefined && !isNaN(sizeKm2) ? sizeKm2 : ''}
            onChange={(e) => onChange('sizeKm2', parseFloat(e.target.value) || 20)}
            style={{ borderColor: errors?.sizeKm2 ? '#f43f5e' : undefined }}
          />
          {errors?.sizeKm2 && <span style={{ fontSize: '0.74rem', color: '#f43f5e', marginTop: 4 }}>{errors.sizeKm2}</span>}
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>One-Way Corridors (Max: {maxOneWayRoutes})</span>
          </div>
          <input
            type="number"
            min="0"
            max={maxOneWayRoutes}
            className="form-control"
            value={oneWayRoutes !== undefined && !isNaN(oneWayRoutes) ? oneWayRoutes : ''}
            onChange={(e) => onChange('oneWayRoutes', parseInt(e.target.value, 10) || 0)}
            style={{ borderColor: errors?.oneWayRoutes ? '#f43f5e' : undefined }}
          />
          {errors?.oneWayRoutes && <span style={{ fontSize: '0.74rem', color: '#f43f5e', marginTop: 4 }}>{errors.oneWayRoutes}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <div className="form-label">
            <span>Road Link Density</span>
          </div>
          <select
            className="form-control"
            value={density}
            onChange={(e) => onChange('density', e.target.value)}
          >
            <option value="Low">Low Density (Sparse)</option>
            <option value="Medium">Medium Density (Suburban)</option>
            <option value="High">High Density (Urban Core)</option>
          </select>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>Junction Frequency</span>
          </div>
          <select
            className="form-control"
            value={junctions}
            onChange={(e) => onChange('junctions', e.target.value)}
          >
            <option value="Low">Low Intersections</option>
            <option value="Medium">Standard Intersections</option>
            <option value="High">Complex Intersections</option>
          </select>
        </div>
      </div>

      {/* Lane Distribution */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Lane Capacity Distribution (Auto-Sum: 100%)</span>
          <span className={`badge ${isTotalValid ? 'badge-emerald' : 'badge-amber'}`}>
            {(laneDistribution.oneLanePercentage + laneDistribution.twoLanePercentage + laneDistribution.fourLanePercentage).toFixed(1)}%
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>1-Lane (%)</span>
            <input
              type="number"
              step="0.1"
              className="form-control"
              value={laneDistribution.oneLanePercentage}
              onChange={(e) => handleLaneChange('oneLanePercentage', e.target.value)}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>2-Lanes (%)</span>
            <input
              type="number"
              step="0.1"
              className="form-control"
              value={laneDistribution.twoLanePercentage}
              onChange={(e) => handleLaneChange('twoLanePercentage', e.target.value)}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>4-Lanes (%)</span>
            <input
              type="number"
              step="0.1"
              className="form-control"
              value={laneDistribution.fourLanePercentage}
              onChange={(e) => handleLaneChange('fourLanePercentage', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrafficSection({ level, pattern, timeOfDay, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sliders size={18} color="#f59e0b" /> Traffic Demand & Flow
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label"><span>Congestion Level</span></div>
          <select className="form-control" value={level} onChange={(e) => onChange('level', e.target.value)}>
            <option value="Low">Low Flow</option>
            <option value="Medium">Moderate</option>
            <option value="High">Rush Hour High</option>
            <option value="Severe">Gridlock Peak</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label"><span>Flow Pattern</span></div>
          <select className="form-control" value={pattern} onChange={(e) => onChange('pattern', e.target.value)}>
            <option value="Random">Uniform Random</option>
            <option value="Commute">Radial Commute</option>
            <option value="Highway">Arterial Highway</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label"><span>Time of Day</span></div>
          <input
            type="time"
            className="form-control"
            value={timeOfDay}
            onChange={(e) => onChange('timeOfDay', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export function ConditionsSection({ weather, roadCondition, onChange, errors }) {
  const handleGoodChange = (e) => {
    let val = parseFloat(e.target.value) || 0;
    let bad = roadCondition.bad;
    let average = Math.max(0, 100 - val - bad);
    onChange('roadCondition', { good: val, average, bad });
  };

  const handleBadChange = (e) => {
    let val = parseFloat(e.target.value) || 0;
    let good = roadCondition.good;
    let average = Math.max(0, 100 - good - val);
    onChange('roadCondition', { good, average, bad: val });
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CloudSun size={18} color="#38bdf8" /> Weather & Surface Quality
      </h3>

      <div className="form-group">
        <div className="form-label"><span>Environmental Weather</span></div>
        <select className="form-control" value={weather} onChange={(e) => onChange('weather', e.target.value)}>
          <option value="Normal">Clear / Normal</option>
          <option value="Rainy">Heavy Rain (Speed -20%)</option>
          <option value="Sunny">High Visibility</option>
          <option value="Windy">Stormy Winds</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">
          <span>Road Quality Balance</span>
          <span className="badge badge-emerald">Sum: 100%</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Good (≤60%)</span>
            <input
              type="number"
              className="form-control"
              value={roadCondition.good}
              onChange={handleGoodChange}
              style={{ borderColor: errors?.roadConditionGood ? '#f43f5e' : undefined }}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Average (Auto)</span>
            <input
              type="number"
              className="form-control"
              value={roadCondition.average}
              disabled
              style={{ opacity: 0.7 }}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Bad (≤20%)</span>
            <input
              type="number"
              className="form-control"
              value={roadCondition.bad}
              onChange={handleBadChange}
              style={{ borderColor: errors?.roadConditionBad ? '#f43f5e' : undefined }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventsSection({ accidents, roadClosures, constructionZones, onChange, errors }) {
  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={18} color="#f43f5e" /> Dynamic Network Incidents
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label"><span>Accidents</span></div>
          <input
            type="number"
            min="0"
            max="10"
            className="form-control"
            value={accidents}
            onChange={(e) => onChange('accidents', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label"><span>Road Closures</span></div>
          <input
            type="number"
            min="0"
            max="10"
            className="form-control"
            value={roadClosures}
            onChange={(e) => onChange('roadClosures', parseInt(e.target.value, 10) || 0)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label"><span>Construction</span></div>
          <input
            type="number"
            min="0"
            max="10"
            className="form-control"
            value={constructionZones}
            onChange={(e) => onChange('constructionZones', parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

export function OptimizationSection({ priority, onChange }) {
  return (
    <div className="glass-panel" style={{ padding: '20px 22px' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={18} color="#c084fc" /> Optimization Objective Mode
      </h3>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label"><span>Metaheuristic Search Focus</span></div>
        <select className="form-control" value={priority} onChange={(e) => onChange('priority', e.target.value)}>
          <option value="Balanced">Balanced Multi-Objective (Time + Dist + Cong)</option>
          <option value="Time">Travel Time Minimization</option>
          <option value="Distance">Minimum Physical Distance</option>
          <option value="Congestion">Bottleneck Avoidance</option>
        </select>
      </div>
    </div>
  );
}
