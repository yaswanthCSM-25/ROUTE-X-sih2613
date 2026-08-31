import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import SimulationPage from './pages/SimulationPage';
import MathModelPage from './pages/MathModelPage';
import OptimizationPage from './pages/OptimizationPage';
import RoutesPage from './pages/RoutesPage';
import ResultsPage from './pages/ResultsPage';
import ConvergencePage from './pages/ConvergencePage';
import BenchmarkPage from './pages/BenchmarkPage';
import DynamicRoutingPage from './pages/DynamicRoutingPage';
import ArchitecturePage from './pages/ArchitecturePage';
import AboutSihPage from './pages/AboutSihPage';

import {
  fetchHealth,
  fetchProjectInfo,
  fetchScenarios,
  fetchNetwork,
  fetchTraffic,
  fetchVehicles,
  optimizeRoutes,
  injectIncident,
} from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('simulation');
  const [backendOnline, setBackendOnline] = useState(false);
  const [projectInfo, setProjectInfo] = useState(null);
  const [scenarios, setScenarios] = useState([
    { id: 'demo', name: '9-Node Demo' },
    { id: 'rush_hour', name: 'Rush Hour Surge' },
    { id: 'bridge_closure', name: 'Bridge Closure Detour' },
    { id: 'smart_grid', name: '16-Node Grid' },
    { id: 'metropolitan', name: '30-Node Metro' },
  ]);
  const [currentPreset, setCurrentPreset] = useState('demo');

  // Network, Traffic, Vehicles state
  const [network, setNetwork] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [fleetSize, setFleetSize] = useState(5);
  const [roadOverrides, setRoadOverrides] = useState({});
  const [baselineMethod, setBaselineMethod] = useState('dijkstra');

  // Theme State (Dark / Light) with localStorage persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('route_planner_theme') || 'dark';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('route_planner_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Optimization params, weights & BPR parameters
  const [params, setParams] = useState({
    num_particles: 20,
    num_iterations: 35,
    traffic_seed: 42,
  });
  const [weights, setWeights] = useState({
    alpha: 0.40,
    beta: 0.30,
    gamma: 0.30,
  });
  const [bprParams, setBprParams] = useState({
    alpha: 0.15,
    beta: 4.0,
  });

  // Simulation Configuration (Phase 1 -> Phase 2 -> Phase 3)
  const [simulationConfig, setSimulationConfig] = useState({
    vehicles: { count: 10, type: 'Mixed' },
    roadNetwork: { size: 'Medium', density: 'Medium', oneWay: 'OFF', junctions: 'Medium', roadCapacity: 'Medium' },
    traffic: { level: 'Medium', pattern: 'Random', timeOfDay: '08:00 AM' },
    conditions: { weather: 'Normal', roadCondition: 'Average' },
    events: { accidents: 0, roadClosures: 0, constructionZones: 0 },
    optimization: { priority: 'Balanced' },
  });

  // Simulation Mode ('setup' | 'map')
  const [simulationMode, setSimulationMode] = useState('setup');

  // Benchmark results & Incident state
  const [benchmark, setBenchmark] = useState(null);
  const [incidentResult, setIncidentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Initial Data Load
  useEffect(() => {
    async function init() {
      const health = await fetchHealth();
      setBackendOnline(!!health);

      const info = await fetchProjectInfo();
      if (info) setProjectInfo(info);

      const scen = await fetchScenarios();
      if (scen?.scenarios?.length) setScenarios(scen.scenarios);

      await loadScenario('demo');
    }
    init();
  }, []);

  // Load a scenario preset
  const loadScenario = async (presetId) => {
    setCurrentPreset(presetId);
    setRoadOverrides({});
    setIncidentResult(null);

    const defaultCount = presetId === 'metropolitan' ? 20 : (presetId === 'smart_grid' ? 10 : 5);
    setFleetSize(defaultCount);

    // Sync simulationConfig to reflect preset scale & conditions
    setSimulationConfig((prev) => ({
      ...prev,
      roadNetwork: {
        ...prev.roadNetwork,
        size: presetId === 'metropolitan' || presetId === 'smart_grid' ? 'High' : 'Medium',
        density: presetId === 'metropolitan' ? 'High' : 'Medium',
      },
      traffic: {
        ...prev.traffic,
        level: presetId === 'rush_hour' ? 'High' : 'Medium',
      },
      events: {
        ...prev.events,
        roadClosures: presetId === 'bridge_closure' ? 1 : 0,
      },
      vehicles: {
        ...prev.vehicles,
        count: defaultCount,
      },
    }));

    try {
      const net = await fetchNetwork(presetId);
      const traf = await fetchTraffic(presetId, params.traffic_seed);
      const veh = await fetchVehicles(presetId, defaultCount);

      setNetwork(net);
      setTraffic(traf);
      setVehicles(veh?.vehicles || []);

      runOptimizationWithConfig({
        preset: presetId,
        num_particles: params.num_particles,
        num_iterations: params.num_iterations,
        traffic_seed: params.traffic_seed,
        weights,
        custom_vehicles: veh?.vehicles || [],
        fleet_size: defaultCount,
        road_status_overrides: presetId === 'bridge_closure' ? { 'E-H': 'CLOSED', 'H-E': 'CLOSED' } : {},
        baseline_method: baselineMethod,
        bpr_alpha: bprParams.alpha,
        bpr_beta: bprParams.beta,
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

  const handleRunOptimization = (opts = {}) => {
    const pCount = opts?.particles || params.num_particles;
    const iters = opts?.iterations || params.num_iterations;
    const w = opts?.weights || weights;

    runOptimizationWithConfig({
      preset: currentPreset,
      num_particles: pCount,
      num_iterations: iters,
      traffic_seed: params.traffic_seed,
      weights: w,
      road_status_overrides: roadOverrides,
      custom_vehicles: vehicles,
      fleet_size: fleetSize,
      baseline_method: baselineMethod,
      bpr_alpha: bprParams.alpha,
      bpr_beta: bprParams.beta,
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

    if (network?.roads) {
      const updatedRoads = network.roads.map((r) => {
        if ((r.source === source && r.target === target) || (r.source === target && r.target === source)) {
          return { ...r, status: nextStatus };
        }
        return r;
      });
      setNetwork({ ...network, roads: updatedRoads });
    }

    runOptimizationWithConfig({
      preset: currentPreset,
      num_particles: params.num_particles,
      num_iterations: params.num_iterations,
      traffic_seed: params.traffic_seed,
      weights,
      road_status_overrides: updatedOverrides,
      custom_vehicles: vehicles,
      fleet_size: fleetSize,
      baseline_method: baselineMethod,
      bpr_alpha: bprParams.alpha,
      bpr_beta: bprParams.beta,
    });
  };

  // Dynamic Incident Injection
  const handleInjectIncident = async (incidentPayload) => {
    setIsLoading(true);
    try {
      const res = await injectIncident(incidentPayload);
      setIncidentResult(res);
      if (res.post_incident) {
        setBenchmark(res.post_incident);
        if (res.post_incident.network) setNetwork(res.post_incident.network);
      }
    } catch (err) {
      console.error('Incident injection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearIncidents = () => {
    setIncidentResult(null);
    loadScenario(currentPreset);
  };

  // Fleet management
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

  const availableNodes = (network?.nodes || []).map((n) => n.id);

  return (
    <div className="app-container">
      {/* Upper Navigation Header */}
      <Header
        activePage={activePage}
        onNavigate={setActivePage}
        backendOnline={backendOnline}
        scenarios={scenarios}
        currentPreset={currentPreset}
        onSelectPreset={loadScenario}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Page Content Body */}
      <main style={{ padding: '24px 28px', maxWidth: 1720, margin: '0 auto', width: '100%' }}>
        {activePage === 'overview' && (
          <OverviewPage
            onNavigate={setActivePage}
            currentPreset={currentPreset}
            backendOnline={backendOnline}
            benchmark={benchmark}
          />
        )}

        {activePage === 'simulation' && (
          <SimulationPage
            simulationConfig={simulationConfig}
            onUpdateSimulationConfig={setSimulationConfig}
            simulationMode={simulationMode}
            onSetSimulationMode={setSimulationMode}
            network={network}
            traffic={traffic}
            scenarios={scenarios}
            currentPreset={currentPreset}
            onSelectPreset={loadScenario}
            onToggleRoadStatus={handleToggleRoadStatus}
            onInjectIncident={handleInjectIncident}
            onClearIncidents={handleClearIncidents}
            incidentResult={incidentResult}
            fleetSize={fleetSize}
            onChangeFleetSize={(sz) => {
              setFleetSize(sz);
              fetchVehicles(currentPreset, sz).then((v) => {
                if (v?.vehicles) {
                  setVehicles(v.vehicles);
                }
              });
            }}
            vehicles={vehicles}
            params={params}
            onChangeParams={setParams}
            onRunOptimization={handleRunOptimization}
            onProceedToOptimization={() => setActivePage('optimization')}
            isLoading={isLoading}
            benchmark={benchmark}
          />
        )}

        {activePage === 'optimization' && (
          <OptimizationPage
            simulationConfig={simulationConfig}
            network={network}
            traffic={traffic}
            vehicles={vehicles}
            fleetSize={fleetSize}
            benchmark={benchmark}
            isLoading={isLoading}
            onRunOptimization={handleRunOptimization}
            onViewOnMap={() => setActivePage('simulation')}
          />
        )}

        {activePage === 'routes' && (
          <RoutesPage
            network={network}
            traffic={traffic}
            benchmark={benchmark}
            onToggleRoadStatus={handleToggleRoadStatus}
          />
        )}

        {activePage === 'results' && (
          <ResultsPage
            benchmark={benchmark}
            simulationConfig={simulationConfig}
            network={network}
            traffic={traffic}
            vehicles={vehicles}
            baselineMethod={baselineMethod}
            onViewOnMap={() => setActivePage('simulation')}
          />
        )}

        {activePage === 'convergence' && (
          <ConvergencePage benchmark={benchmark} />
        )}

        {activePage === 'architecture' && <ArchitecturePage />}

        {activePage === 'about_sih' && <AboutSihPage info={projectInfo} />}
      </main>
    </div>
  );
}
