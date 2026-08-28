import React, { useState, useEffect, useRef } from 'react';
import { Car, Navigation, Eye, EyeOff, Play, Pause, RotateCcw } from 'lucide-react';
import NetworkMap from '../components/NetworkMap';
import VehicleRoutesTable from '../components/VehicleRoutesTable';
import VehicleSimulator from '../components/VehicleSimulator';

export default function RoutesPage({
  network,
  traffic,
  benchmark,
  onToggleRoadStatus,
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showBaselineOverlay, setShowBaselineOverlay] = useState(true);
  const [showQpsoOverlay, setShowQpsoOverlay] = useState(true);

  // Playback Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const animRef = useRef(null);

  useEffect(() => {
    if (!isSimulating) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setSimProgress((prev) => {
        const next = prev + delta * 0.15 * simSpeed;
        if (next >= 1.0) {
          setIsSimulating(false);
          return 1.0;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating, simSpeed]);

  const baselineRoutes = benchmark?.routes?.baseline || [];
  const qpsoRoutes = benchmark?.routes?.qpso || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '22px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-emerald"><Car size={13} /> Fleet Navigation</span>
              <span className="badge badge-cyan">Path Trajectories</span>
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#f8fafc' }}>
              Multi-Vehicle Route Assignments & Turn-by-Turn Inspection
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedVehicleId && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedVehicleId(null)}
                style={{ fontSize: '0.8rem' }}
              >
                Clear Focus ({selectedVehicleId})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map & Visualizer */}
      <NetworkMap
        network={network}
        traffic={traffic}
        baselineRoutes={baselineRoutes}
        qpsoRoutes={qpsoRoutes}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        onToggleRoadStatus={onToggleRoadStatus}
        simProgress={simProgress}
        isSimulating={isSimulating}
        showBaselineOverlay={showBaselineOverlay}
        showQpsoOverlay={showQpsoOverlay}
        onToggleBaselineOverlay={() => setShowBaselineOverlay(!showBaselineOverlay)}
        onToggleQpsoOverlay={() => setShowQpsoOverlay(!showQpsoOverlay)}
      />

      {/* Vehicle Playback Scrubber */}
      <VehicleSimulator
        isSimulating={isSimulating}
        simProgress={simProgress}
        onToggleSimulate={() => {
          if (simProgress >= 1) setSimProgress(0);
          setIsSimulating(!isSimulating);
        }}
        onResetSimulate={() => {
          setIsSimulating(false);
          setSimProgress(0);
        }}
        simSpeed={simSpeed}
        onChangeSpeed={setSimSpeed}
        onSeekProgress={(val) => {
          setSimProgress(val);
          if (val < 1) setIsSimulating(false);
        }}
      />

      {/* Turn-by-Turn Route Cards */}
      <VehicleRoutesTable
        baselineRoutes={baselineRoutes}
        qpsoRoutes={qpsoRoutes}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
      />
    </div>
  );
}
