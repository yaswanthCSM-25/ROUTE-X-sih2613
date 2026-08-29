import React, { useState } from 'react';
import SimulationControlCenter from '../components/simulation-center/SimulationControlCenter';
import CitySimulationMap from '../components/CitySimulationMap';

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
  // Mode: 'setup' (Phase 1 6-section config) | 'map' (Phase 2 Full-Screen 2D City Map)
  const [simulationMode, setSimulationMode] = useState('setup');
  const [activeConfig, setActiveConfig] = useState(null);

  const handleSimulate = (config) => {
    setActiveConfig(config);
    if (config?.vehicles?.count && onChangeFleetSize) {
      onChangeFleetSize(config.vehicles.count);
    }
    // Transition to Phase 2 Full-screen 2D Illustrated City Map
    setSimulationMode('map');
  };

  const handleReconfigure = () => {
    setSimulationMode('setup');
  };

  const handleExecuteOptimization = () => {
    if (onRunOptimization) {
      onRunOptimization();
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '80vh' }}>
      {simulationMode === 'setup' ? (
        /* Phase 1: Simulation Setup & 6 Configuration Sections */
        <SimulationControlCenter
          onSimulate={handleSimulate}
          isLoading={isLoading}
        />
      ) : (
        /* Phase 2: Full-Screen Interactive 2D Illustrated City Map */
        <CitySimulationMap
          config={activeConfig}
          network={network}
          traffic={traffic}
          vehicles={vehicles}
          onReconfigure={handleReconfigure}
          onRunOptimization={handleExecuteOptimization}
          isLoading={isLoading}
          benchmark={benchmark}
        />
      )}
    </div>
  );
}
