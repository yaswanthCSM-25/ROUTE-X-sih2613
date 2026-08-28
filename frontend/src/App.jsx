import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import NetworkMap from './components/NetworkMap';
import ControlPanel from './components/ControlPanel';
import MetricsComparison from './components/MetricsComparison';
import ConvergenceChart from './components/ConvergenceChart';
import VehicleRoutesTable from './components/VehicleRoutesTable';
import VehicleSimulator from './components/VehicleSimulator';
import DeliverablesModal from './components/DeliverablesModal';
import {
  fetchHealth,
  fetchProjectInfo,
  fetchScenarios,
  fetchNetwork,
  fetchTraffic,
  fetchVehicles,
  optimizeRoutes,
} from './services/api';

export default function App() {
  const [backendOnline, setBackendOnline] = useState(false);
  const [projectInfo, setProjectInfo] = useState(null);
  const [scenarios, setScenarios] = useState([
    { id: 'demo', name: 'Standard 9-Node' },
    { id: 'rush_hour', name: 'Rush Hour Congestion' },
    { id: 'bridge_closure', name: 'Bridge Closure Detour' },
    { id: 'smart_grid', name: '16-Node City Grid' },
  ]);
  const [currentPreset, setCurrentPreset] = useState('demo');

  // Network, Traffic, Vehicles state
  const [network, setNetwork] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [roadOverrides, setRoadOverrides] = useState({});

  // Optimization params & weights
  const [params, setParams] = useState({
    num_particles: 20,
    num_iterations: 50,
    traffic_seed: 42,
    steps_per_vehicle: 12,
  });
  const [weights, setWeights] = useState({
    alpha: 0.40,
    beta: 0.30,
    gamma: 0.30,
  });

  // Benchmark results
  const [benchmark, setBenchmark] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // UI state
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [showBaselineOverlay, setShowBaselineOverlay] = useState(true);
  const [showQpsoOverlay, setShowQpsoOverlay] = useState(true);
  const [isDeliverablesOpen, setIsDeliverablesOpen] = useState(false);

  // Simulation playback state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const animRef = useRef(null);

  // Initial Data Load
  useEffect(() => {
    async function init() {
      const health = await fetchHealth();
      setBackendOnline(!!health);

      const info = await fetchProjectInfo();
      if (info) setProjectInfo(info);

      const scen = await fetchScenarios();
      if (scen?.scenarios?.length) setScenarios(scen.scenarios);

      // Load initial demo
      await loadScenario('demo');
    }
    init();
  }, []);

  // Load a scenario preset
  const loadScenario = async (presetId) => {
    setCurrentPreset(presetId);
    setRoadOverrides({});
    setSelectedVehicleId(null);
    setSimProgress(0);
    setIsSimulating(false);

    try {
      const net = await fetchNetwork(presetId);
      const traf = await fetchTraffic(presetId, params.traffic_seed);
      const veh = await fetchVehicles(presetId);

      setNetwork(net);
      setTraffic(traf);
      setVehicles(veh?.vehicles || []);

      // Auto run optimization for fresh scenario
      runOptimizationWithConfig({
        preset: presetId,
        num_particles: params.num_particles,
        num_iterations: params.num_iterations,
        traffic_seed: params.traffic_seed,
        weights,
        custom_vehicles: veh?.vehicles || [],
        road_status_overrides: {},
        steps_per_vehicle: presetId === 'smart_grid' ? 18 : 12,
      });
    } catch (err) {
      console.error('Failed to load scenario:', err);
    }
  };

  // Run Optimization Core
  const runOptimizationWithConfig = async (payload) => {
    setIsLoading(true);
    setElapsedTime(0);
    const start = performance.now();
    const timer = setInterval(() => {
      setElapsedTime(((performance.now() - start) / 1000).toFixed(1));
    }, 100);

    try {
      const res = await optimizeRoutes(payload);
      setBenchmark(res);
      if (res.network) setNetwork(res.network);
      if (res.vehicles) setVehicles(res.vehicles);
      setBackendOnline(true);
    } catch (err) {
      console.error('Optimization run failed:', err);
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  const handleRunOptimization = () => {
    runOptimizationWithConfig({
      preset: currentPreset,
      num_particles: params.num_particles,
      num_iterations: params.num_iterations,
      traffic_seed: params.traffic_seed,
      weights,
      road_status_overrides: roadOverrides,
      custom_vehicles: vehicles,
      steps_per_vehicle: currentPreset === 'smart_grid' ? 18 : 12,
    });
  };

  // Toggle Road Status (OPEN/CLOSED)
  const handleToggleRoadStatus = (source, target) => {
    const key = `${source}-${target}`;
    const reverseKey = `${target}-${source}`;
    const currentRoad = (network?.roads || []).find(
      (r) => (r.source === source && r.target === target) || (r.source === target && r.target === source)
    );
    const nextStatus = currentRoad?.status === 'CLOSED' ? 'OPEN' : 'CLOSED';

    const updatedOverrides = {
      ...roadOverrides,
      [key]: nextStatus,
      [reverseKey]: nextStatus,
    };
    setRoadOverrides(updatedOverrides);

    // Optimistically update network
    if (network?.roads) {
      const updatedRoads = network.roads.map((r) => {
        if ((r.source === source && r.target === target) || (r.source === target && r.target === source)) {
          return { ...r, status: nextStatus };
        }
        return r;
      });
      setNetwork({ ...network, roads: updatedRoads });
    }

    // Trigger re-optimization immediately
    runOptimizationWithConfig({
      preset: currentPreset,
      num_particles: params.num_particles,
      num_iterations: params.num_iterations,
      traffic_seed: params.traffic_seed,
      weights,
      road_status_overrides: updatedOverrides,
      custom_vehicles: vehicles,
      steps_per_vehicle: currentPreset === 'smart_grid' ? 18 : 12,
    });
  };

  // Vehicle Fleet management
  const handleAddVehicle = () => {
    const nodes = (network?.nodes || []).map((n) => n.id);
    if (nodes.length < 2) return;
    const origin = nodes[0];
    const destination = nodes[nodes.length - 1];
    const nextId = `V${vehicles.length + 1}`;
    setVehicles([...vehicles, { vehicle_id: nextId, origin, destination }]);
  };

  const handleRemoveVehicle = (idx) => {
    const updated = vehicles.filter((_, i) => i !== idx);
    setVehicles(updated);
  };

  const handleUpdateVehicle = (idx, updatedVeh) => {
    const updated = [...vehicles];
    updated[idx] = updatedVeh;
    setVehicles(updated);
  };

  // Simulation Animation Loop
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

  const availableNodes = (network?.nodes || []).map((n) => n.id);
  const baselineRoutes = benchmark?.routes?.baseline || [];
  const qpsoRoutes = benchmark?.routes?.qpso || [];

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        backendOnline={backendOnline}
        scenarios={scenarios}
        currentPreset={currentPreset}
        onSelectPreset={loadScenario}
        onOpenDeliverables={() => setIsDeliverablesOpen(true)}
      />

      {/* Main Grid Content */}
      <main className="main-content">
        {/* Left Column: Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ControlPanel
            params={params}
            onChangeParams={setParams}
            weights={weights}
            onChangeWeights={setWeights}
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onRemoveVehicle={handleRemoveVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            availableNodes={availableNodes}
            onRunOptimization={handleRunOptimization}
            isLoading={isLoading}
            elapsedTime={elapsedTime}
          />
        </div>

        {/* Right Column: Visualization & Benchmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Key Metrics Comparison */}
          <MetricsComparison benchmark={benchmark} />

          {/* Interactive Map Visualizer */}
          <NetworkMap
            network={network}
            traffic={traffic}
            baselineRoutes={baselineRoutes}
            qpsoRoutes={qpsoRoutes}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
            onToggleRoadStatus={handleToggleRoadStatus}
            simProgress={simProgress}
            isSimulating={isSimulating}
            showBaselineOverlay={showBaselineOverlay}
            showQpsoOverlay={showQpsoOverlay}
            onToggleBaselineOverlay={() => setShowBaselineOverlay(!showBaselineOverlay)}
            onToggleQpsoOverlay={() => setShowQpsoOverlay(!showQpsoOverlay)}
          />

          {/* Vehicle Simulation Playback Scrubber */}
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

          {/* Convergence Analytics Chart */}
          <ConvergenceChart convergence={benchmark?.convergence} />

          {/* Turn-by-Turn Fleet Routes Table */}
          <VehicleRoutesTable
            baselineRoutes={baselineRoutes}
            qpsoRoutes={qpsoRoutes}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
          />
        </div>
      </main>

      {/* Deliverables & Mathematical Formulation Modal */}
      <DeliverablesModal
        isOpen={isDeliverablesOpen}
        onClose={() => setIsDeliverablesOpen(false)}
        info={projectInfo}
      />
    </div>
  );
}
