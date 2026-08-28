import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, RotateCcw, Zap, RefreshCw } from 'lucide-react';

export default function IncidentSimulator({
  roads = [],
  currentPreset,
  onInjectIncident,
  onClearIncidents,
  incidentResult,
  isLoading,
}) {
  const [selectedRoad, setSelectedRoad] = useState('E-H');
  const [incidentType, setIncidentType] = useState('ROAD_CLOSURE');
  const [description, setDescription] = useState('Major traffic collision & road obstruction');

  // Build unique road options
  const roadOptions = React.useMemo(() => {
    const seen = new Set();
    const opts = [];
    roads.forEach((r) => {
      const key = [r.source, r.target].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        opts.push({ key, source: r.source, target: r.target });
      }
    });
    return opts;
  }, [roads]);

  React.useEffect(() => {
    if (roadOptions.length > 0) {
      const exists = roadOptions.some((opt) => opt.key === selectedRoad);
      if (!exists) {
        setSelectedRoad(roadOptions[0].key);
      }
    }
  }, [roadOptions, selectedRoad]);

  const handleTrigger = () => {
    const [u, v] = selectedRoad.split('-');
    onInjectIncident({
      preset: currentPreset,
      source: u,
      target: v,
      incident_type: incidentType,
      severity: 1.0,
      description,
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '18px 22px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="#f43f5e" /> Dynamic Incident Simulation & Rerouting
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Inject sudden road blockages, accidents, or bottlenecks to test real-time adaptive rerouting
          </p>
        </div>

        {incidentResult && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClearIncidents}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            <RotateCcw size={13} /> Reset Incidents
          </button>
        )}
      </div>

      {/* Incident Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 14,
      }}>
        {/* Road Selector */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Road Corridor</label>
          <select
            className="form-control"
            value={selectedRoad}
            onChange={(e) => setSelectedRoad(e.target.value)}
          >
            {roadOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                Segment: {opt.source} ↔ {opt.target}
              </option>
            ))}
          </select>
        </div>

        {/* Incident Type */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Incident Type</label>
          <select
            className="form-control"
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
          >
            <option value="ROAD_CLOSURE">⛔ Complete Road Closure (Obstruction)</option>
            <option value="ACCIDENT">💥 Severe Accident (Congestion Surge + 50% Cap)</option>
            <option value="CONGESTION_SPIKE">🚗 Sudden Traffic Gridlock</option>
            <option value="CAPACITY_DROP">🚧 Construction Lane Narrowing</option>
          </select>
        </div>

        {/* Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={handleTrigger}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              boxShadow: '0 4px 16px rgba(244, 63, 94, 0.35)',
              padding: '9px 16px',
              fontSize: '0.88rem',
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Rerouting...</span>
              </>
            ) : (
              <>
                <ShieldAlert size={16} />
                <span>Inject Incident & Reroute</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incident Result Comparison Banner */}
      {incidentResult && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <strong style={{ color: '#f43f5e' }}>Incident Injected:</strong> {incidentResult.incident?.type} on Segment {incidentResult.incident?.source} ↔ {incidentResult.incident?.target}
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: 2 }}>
              All affected vehicles successfully adapted and computed valid detour routes!
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Pre-Incident Time:</span>{' '}
              <strong style={{ color: '#f8fafc' }}>{incidentResult.pre_incident?.qpso?.time_total_min} min</strong>
            </div>
            <div style={{ color: '#64748b' }}>➔</div>
            <div>
              <span style={{ color: '#94a3b8' }}>Post-Incident Detour:</span>{' '}
              <strong style={{ color: '#f43f5e' }}>{incidentResult.post_incident?.qpso?.time_total_min} min</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
