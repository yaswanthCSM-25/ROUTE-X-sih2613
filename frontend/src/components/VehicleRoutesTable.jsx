import React from 'react';
import { Car, ArrowRight, CheckCircle2, AlertCircle, Compass } from 'lucide-react';

export default function VehicleRoutesTable({
  baselineRoutes = [],
  qpsoRoutes = [],
  selectedVehicleId,
  onSelectVehicle,
}) {
  if (!baselineRoutes.length && !qpsoRoutes.length) {
    return null;
  }

  // Combine by vehicle_id
  const vehicleMap = {};
  baselineRoutes.forEach((b) => {
    vehicleMap[b.vehicle_id] = { ...vehicleMap[b.vehicle_id], baseline: b };
  });
  qpsoRoutes.forEach((q) => {
    vehicleMap[q.vehicle_id] = { ...vehicleMap[q.vehicle_id], qpso: q };
  });

  const vehiclesList = Object.keys(vehicleMap).map((id) => ({
    vehicle_id: id,
    origin: vehicleMap[id].baseline?.origin || '?',
    destination: vehicleMap[id].baseline?.destination || '?',
    baseline: vehicleMap[id].baseline,
    qpso: vehicleMap[id].qpso,
  }));

  return (
    <div className="glass-panel" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car size={18} color="#10b981" /> Fleet Route Assignments & Comparison
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Click any vehicle to focus its route on the interactive map
          </p>
        </div>

        {selectedVehicleId && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSelectVehicle(null)}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Show All Vehicles
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        {vehiclesList.map(({ vehicle_id, origin, destination, baseline, qpso }) => {
          const isSelected = selectedVehicleId === vehicle_id;

          return (
            <div
              key={vehicle_id}
              onClick={() => onSelectVehicle(isSelected ? null : vehicle_id)}
              style={{
                background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(8, 12, 22, 0.7)',
                border: isSelected ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 0 15px rgba(16, 185, 129, 0.25)' : 'none',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#ffffff' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    fontFamily: 'Outfit',
                  }}>
                    {vehicle_id}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                    {origin} ➔ {destination}
                  </span>
                </div>

                <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={11} /> Valid Route
                </span>
              </div>

              {/* Baseline Path */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 8,
                fontSize: '0.78rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 600, marginBottom: 2 }}>
                  <span>Dijkstra Baseline:</span>
                  <span>{baseline?.distance_km} km • {baseline?.time_min} min</span>
                </div>
                <div style={{ color: '#cbd5e1', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                  {baseline?.path?.join(' ➔ ') || 'Unreachable'}
                </div>
              </div>

              {/* QPSO Path */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: '0.78rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', fontWeight: 600, marginBottom: 2 }}>
                  <span>Quantum QPSO:</span>
                  <span>{qpso?.distance_km} km • {qpso?.time_min} min</span>
                </div>
                <div style={{ color: '#f8fafc', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', fontWeight: 600 }}>
                  {qpso?.path?.join(' ➔ ') || 'Unreachable'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
