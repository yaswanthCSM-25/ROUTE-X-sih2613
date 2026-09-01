import React, { useState } from 'react';
import SimulationControlCenter from '../components/simulation-center/SimulationControlCenter';
import CitySimulationMap from '../components/CitySimulationMap';

export default function SimulationPage({
  simulationConfig,
  onUpdateSimulationConfig,
  simulationMode: externalSimMode,
  onSetSimulationMode: externalSetSimMode,
  network,
  traffic,
  scenarios,
  currentPreset,
  onSelectPreset,
  onToggleRoadStatus,
  onInjectIncident,
  onClearIncidents,
  incidentResult,
  fleetSize,
  onChangeFleetSize,
  vehicles,
  params,
  onChangeParams,
  onRunOptimization,
  onProceedToOptimization,
  isLoading,
  benchmark,
}) {
  // Mode: 'setup' (Phase 1 6-section config) | 'map' (Phase 2 Full-Screen 2D City Map)
  const [internalMode, setInternalMode] = useState('setup');

  const simulationMode = externalSimMode !== undefined ? externalSimMode : internalMode;
  const setSimulationMode = externalSetSimMode || setInternalMode;

  const handleSimulate = (config) => {
    if (onUpdateSimulationConfig) {
      onUpdateSimulationConfig(config);
    }
    if (config?.vehicles?.count && onChangeFleetSize) {
      onChangeFleetSize(config.vehicles.count);
    }
    // Navigate directly to Phase 4 Route Optimization
    if (onProceedToOptimization) {
      onProceedToOptimization();
    } else {
      setSimulationMode('map');
    }
  };

  const handleOpenMap = (config) => {
    if (onUpdateSimulationConfig) {
      onUpdateSimulationConfig(config);
    }
    if (config?.vehicles?.count && onChangeFleetSize) {
      onChangeFleetSize(config.vehicles.count);
    }
    setSimulationMode('map');
  };

  const handleReconfigure = () => {
    setSimulationMode('setup');
  };

  const handleExecuteProceedToOptimization = () => {
    if (onProceedToOptimization) {
      onProceedToOptimization();
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '80vh' }}>
      {simulationMode === 'setup' ? (
        /* Phase 1: Simulation Setup & 6 Configuration Sections with Scenarios */
        <SimulationControlCenter
          onSimulate={handleSimulate}
          onOpenMap={handleOpenMap}
          scenarios={scenarios}
          currentPreset={currentPreset}
          onSelectPreset={onSelectPreset}
          isLoading={isLoading}
        />
      ) : (
        /* Phase 2: Full-Screen Interactive 2D Illustrated City Map with Scenarios & Dynamic Incidents */
        <CitySimulationMap
          config={simulationConfig}
          network={network}
          traffic={traffic}
          vehicles={vehicles}
          scenarios={scenarios}
          currentPreset={currentPreset}
          onSelectPreset={onSelectPreset}
          onInjectIncident={onInjectIncident}
          onClearIncidents={onClearIncidents}
          incidentResult={incidentResult}
          onToggleRoadStatus={onToggleRoadStatus}
          onReconfigure={handleReconfigure}
          onRunOptimization={handleExecuteProceedToOptimization}
          isLoading={isLoading}
          benchmark={benchmark}
        />
      )}
    </div>
  );
}
