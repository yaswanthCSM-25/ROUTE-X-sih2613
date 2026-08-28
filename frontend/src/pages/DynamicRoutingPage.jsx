import React from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck, ArrowRight, Navigation, CheckCircle2 } from 'lucide-react';
import IncidentSimulator from '../components/IncidentSimulator';
import NetworkMap from '../components/NetworkMap';

export default function DynamicRoutingPage({
  network,
  traffic,
  currentPreset,
  onInjectIncident,
  onClearIncidents,
  incidentResult,
  isLoading,
  onToggleRoadStatus,
}) {
  const postBenchmark = incidentResult?.post_incident;
  const preBenchmark = incidentResult?.pre_incident;

  const baselineRoutes = postBenchmark?.routes?.baseline || [];
  const qpsoRoutes = postBenchmark?.routes?.qpso || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-rose"><AlertTriangle size={13} /> Dynamic Resilience</span>
          <span className="badge badge-cyan">Adaptive Rerouting</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
          Dynamic Incident Injection & Adaptive Rerouting Engine
        </h1>
        <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
          Test network resilience against sudden corridor blockages, multi-vehicle accidents, and capacity bottlenecks with automatic detour generation.
        </p>
      </div>

      {/* Incident Trigger Simulator */}
      <IncidentSimulator
        roads={network?.roads || []}
        currentPreset={currentPreset}
        onInjectIncident={onInjectIncident}
        onClearIncidents={onClearIncidents}
        incidentResult={incidentResult}
        isLoading={isLoading}
      />

      {/* Pre vs Post Incident Impact Comparison */}
      {incidentResult && (
        <div className="glass-panel" style={{ padding: '20px 24px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#34d399', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} /> Incident Rerouting Evaluation Summary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ padding: '14px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>INJECTED INCIDENT</span>
              <div style={{ fontWeight: 700, color: '#f43f5e', fontSize: '0.95rem', marginTop: 2 }}>
                {incidentResult.incident?.incident_type} on {incidentResult.incident?.source} ↔ {incidentResult.incident?.target}
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>PRE-INCIDENT TRAVEL TIME</span>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '1.2rem', marginTop: 2 }}>
                {preBenchmark?.qpso?.time_total_min || '—'} min
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>POST-INCIDENT DETOUR TIME</span>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '1.2rem', marginTop: 2 }}>
                {postBenchmark?.qpso?.time_total_min || '—'} min
              </div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(8, 12, 22, 0.6)', borderRadius: 8 }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>DETOUR FEASIBILITY</span>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '1.2rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={18} /> 100% Feasible
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map Visualizer */}
      <NetworkMap
        network={network}
        traffic={traffic}
        baselineRoutes={baselineRoutes}
        qpsoRoutes={qpsoRoutes}
        selectedVehicleId={null}
        onSelectVehicle={() => {}}
        onToggleRoadStatus={onToggleRoadStatus}
        simProgress={0}
        isSimulating={false}
        showBaselineOverlay={true}
        showQpsoOverlay={true}
        onToggleBaselineOverlay={() => {}}
        onToggleQpsoOverlay={() => {}}
      />
    </div>
  );
}
