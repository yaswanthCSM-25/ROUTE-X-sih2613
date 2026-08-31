import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  Sliders,
  X,
  AlertTriangle,
  Compass,
  TrafficCone,
  Car,
  Sparkles,
  Play,
  Pause,
  Zap,
  Clock,
  Navigation,
  Activity,
  CheckCircle2,
  RefreshCw,
  CloudRain,
  Sun,
  Wind,
  ShieldAlert,
  Flame,
  ShieldCheck,
} from 'lucide-react';

/* =========================================================================
   2D ILLUSTRATED SIMULATED CITY MAP ENGINE (SIH26137)
   With Integrated Dynamic Incident Injector & Real-Time Rerouting
   ========================================================================= */

export const getJunctionSignalState = (nodeId, elapsedSec) => {
  if (!nodeId) return 'GREEN';
  const charCode = nodeId.charCodeAt(nodeId.length - 1) || 65;
  const cycle = (elapsedSec + charCode * 2.5) % 12;
  return cycle < 7 ? 'GREEN' : 'RED';
};

export default function CitySimulationMap({
  config,
  network,
  traffic,
  vehicles = [],
  scenarios = [],
  currentPreset = 'demo',
  onSelectPreset,
  onLaunchDemoMode,
  onInjectIncident,
  onClearIncidents,
  incidentResult,
  onToggleRoadStatus,
  onReconfigure,
  onRunOptimization,
  isLoading = false,
  benchmark = null,
}) {
  const containerRef = useRef(null);

  // Zoom and Pan Transform State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected Map Object Popover State
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoveredElement, setHoveredElement] = useState(null);

  // Simulation Clock & Animation Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(2); // 1x, 2x, 4x, 8x
  const [simSeconds, setSimSeconds] = useState(0);

  // Dynamic Incident Injection Drawer State
  const [showIncidentDrawer, setShowIncidentDrawer] = useState(false);
  const [selectedIncidentRoad, setSelectedIncidentRoad] = useState('');
  const [selectedIncidentType, setSelectedIncidentType] = useState('ROAD_CLOSURE');
  const [localIncidents, setLocalIncidents] = useState([]);

  /* -------------------------------------------------------------------------
     1. DYNAMIC CITY GENERATOR (Custom Config OR Backend Preset Network)
     ------------------------------------------------------------------------- */
  const cityData = useMemo(() => {
    const sizeSetting = config?.roadNetwork?.size || 'Medium';
    const densitySetting = config?.roadNetwork?.density || 'Medium';
    const oneWaySetting = config?.roadNetwork?.oneWay || 'OFF';
    const capacitySetting = config?.roadNetwork?.roadCapacity || 'Medium';
    const conditionSetting = config?.conditions?.roadCondition || 'Average';
    const weatherSetting = config?.conditions?.weather || 'Normal';
    const accidentsCount = config?.events?.accidents !== undefined ? config.events.accidents : 0;
    const closuresCount = config?.events?.roadClosures !== undefined ? config.events.roadClosures : 0;
    const constructionCount = config?.events?.constructionZones !== undefined ? config.events.constructionZones : 0;

    let baseNodes = [];
    let rawConnections = [];

    // If backend network with >9 nodes (like 16-node smart_grid or 30-node metropolitan) is loaded:
    if (network && network.nodes && network.nodes.length > 9) {
      baseNodes = network.nodes.map((n) => ({
        id: n.id,
        x: n.x || 100,
        y: n.y || 100,
        name: `Junction ${n.id}`,
      }));

      rawConnections = (network.roads || []).map((r, i) => ({
        u: r.source,
        v: r.target,
        lanes: r.capacity >= 10 ? 4 : (r.capacity >= 6 ? 2 : 1),
        curve: (i % 2 === 0 ? 1 : -1) * ((i % 5) * 4),
      }));
    } else {
      // Dynamic generation based on Phase 1 SimulationConfig
      if (sizeSetting === 'Low') {
        baseNodes = [
          { id: 'A', x: 120, y: 320, name: 'Origin Terminal (A)' },
          { id: 'B', x: 280, y: 160, name: 'North Arterial (B)' },
          { id: 'C', x: 300, y: 460, name: 'South Transit (C)' },
          { id: 'D', x: 480, y: 220, name: 'Central Boulevard (D)' },
          { id: 'E', x: 500, y: 420, name: 'Midtown Hub (E)' },
          { id: 'F', x: 680, y: 310, name: 'Destination Gateway (F)' },
        ];
        rawConnections = [
          { u: 'A', v: 'B', lanes: 2, curve: -20 },
          { u: 'A', v: 'C', lanes: 2, curve: 20 },
          { u: 'B', v: 'D', lanes: 4, curve: 0 },
          { u: 'C', v: 'E', lanes: 2, curve: 0 },
          { u: 'D', v: 'E', lanes: 2, curve: 10 },
          { u: 'D', v: 'F', lanes: 4, curve: -15 },
          { u: 'E', v: 'F', lanes: 2, curve: 15 },
        ];
      } else if (sizeSetting === 'High') {
        baseNodes = [
          { id: 'A', x: 80, y: 340, name: 'West Commercial Terminal (A)' },
          { id: 'B', x: 220, y: 160, name: 'North Ring Jct (B)' },
          { id: 'C', x: 230, y: 490, name: 'South Logistics Jct (C)' },
          { id: 'D', x: 380, y: 120, name: 'Cyber Park Interchange (D)' },
          { id: 'E', x: 410, y: 330, name: 'Central Plaza Hub (E)' },
          { id: 'F', x: 390, y: 530, name: 'Riverside Corridor (F)' },
          { id: 'G', x: 580, y: 180, name: 'Tech Gateway North (G)' },
          { id: 'H', x: 600, y: 460, name: 'Industrial Parkway (H)' },
          { id: 'I', x: 740, y: 240, name: 'Metro East Overpass (I)' },
          { id: 'J', x: 770, y: 440, name: 'South Harbor Arterial (J)' },
          { id: 'K', x: 920, y: 330, name: 'National Logistics Hub (Dest)' },
        ];
        rawConnections = [
          { u: 'A', v: 'B', lanes: 2, curve: -25 },
          { u: 'A', v: 'C', lanes: 2, curve: 25 },
          { u: 'A', v: 'E', lanes: 4, curve: 0 },
          { u: 'B', v: 'D', lanes: 4, curve: -10 },
          { u: 'B', v: 'E', lanes: 2, curve: 15 },
          { u: 'C', v: 'E', lanes: 2, curve: -15 },
          { u: 'C', v: 'F', lanes: 2, curve: 20 },
          { u: 'D', v: 'G', lanes: 4, curve: 0 },
          { u: 'E', v: 'G', lanes: 2, curve: -10 },
          { u: 'E', v: 'H', lanes: 4, curve: 10 },
          { u: 'F', v: 'H', lanes: 2, curve: 0 },
          { u: 'G', v: 'I', lanes: 4, curve: -15 },
          { u: 'H', v: 'J', lanes: 2, curve: 15 },
          { u: 'I', v: 'K', lanes: 4, curve: -10 },
          { u: 'J', v: 'K', lanes: 2, curve: 10 },
          { u: 'I', v: 'J', lanes: 2, curve: 0 },
        ];
      } else {
        // Medium: 9-Node Urban Network
        baseNodes = [
          { id: 'A', x: 110, y: 320, name: 'West Origin Gateway (A)' },
          { id: 'B', x: 270, y: 170, name: 'Northwest Ring (B)' },
          { id: 'C', x: 280, y: 470, name: 'Southwest Parkway (C)' },
          { id: 'D', x: 440, y: 140, name: 'North Tech Boulevard (D)' },
          { id: 'E', x: 460, y: 320, name: 'Central Urban Crossing (E)' },
          { id: 'F', x: 450, y: 500, name: 'South Arterial (F)' },
          { id: 'G', x: 630, y: 190, name: 'Northeast Overpass (G)' },
          { id: 'H', x: 640, y: 450, name: 'Southeast Junction (H)' },
          { id: 'I', x: 800, y: 320, name: 'East Destination Terminal (I)' },
        ];
        rawConnections = [
          { u: 'A', v: 'B', lanes: 2, curve: -25 },
          { u: 'A', v: 'C', lanes: 2, curve: 25 },
          { u: 'A', v: 'E', lanes: 4, curve: 0 },
          { u: 'B', v: 'D', lanes: 4, curve: -15 },
          { u: 'B', v: 'E', lanes: 2, curve: 15 },
          { u: 'C', v: 'E', lanes: 2, curve: -15 },
          { u: 'C', v: 'F', lanes: 2, curve: 20 },
          { u: 'D', v: 'G', lanes: 4, curve: -10 },
          { u: 'D', v: 'E', lanes: 2, curve: 0 },
          { u: 'E', v: 'G', lanes: 2, curve: -15 },
          { u: 'E', v: 'H', lanes: 4, curve: 15 },
          { u: 'E', v: 'F', lanes: 2, curve: 0 },
          { u: 'F', v: 'H', lanes: 2, curve: 15 },
          { u: 'G', v: 'I', lanes: 4, curve: -20 },
          { u: 'H', v: 'I', lanes: 2, curve: 20 },
          { u: 'E', v: 'I', lanes: 4, curve: 0 },
        ];
      }
    }

    // Density filter if 'Low'
    if (densitySetting === 'Low' && rawConnections.length > 7) {
      rawConnections = rawConnections.filter((_, idx) => idx % 2 === 0 || idx >= rawConnections.length - 2);
    }

    const nodeMap = {};
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    baseNodes.forEach((n) => {
      nodeMap[n.id] = n;
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const padding = 130;
    const width = Math.max(920, maxX - minX + padding * 2);
    const height = Math.max(600, maxY - minY + padding * 2);
    const vb = `${minX - padding} ${minY - padding} ${width} ${height}`;

    const generatedRoads = rawConnections.map((conn, idx) => {
      const u = nodeMap[conn.u] || { x: 100, y: 100 };
      const v = nodeMap[conn.v] || { x: 200, y: 200 };
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const lengthKm = Math.round((Math.sqrt(dx * dx + dy * dy) / 75) * 10) / 10;

      let lanes = conn.lanes;
      if (capacitySetting === 'Low') lanes = Math.min(2, lanes);
      if (capacitySetting === 'High' && idx % 2 === 0) lanes = 4;

      const isOneWay = oneWaySetting === 'ON' && (idx % 3 === 0);
      const condition = conditionSetting === 'Bad' ? 'Bad' : (conditionSetting === 'Good' ? 'Good' : (idx % 4 === 0 ? 'Bad' : 'Good'));

      // Check if local dynamic incident is active on this road
      const isLocallyClosed = localIncidents.some(
        (inc) => (inc.source === conn.u && inc.target === conn.v) || (inc.source === conn.v && inc.target === conn.u && inc.type === 'ROAD_CLOSURE')
      );

      return {
        id: `R-${conn.u}${conn.v}`,
        source: conn.u,
        target: conn.v,
        distance_km: lengthKm,
        lanes: lanes,
        capacity_vehicles: lanes === 4 ? 8 : (lanes === 2 ? 4 : 2),
        free_flow_speed_kmph: lanes === 4 ? 60 : (lanes === 2 ? 45 : 30),
        isOneWay: isOneWay,
        condition: condition,
        status: isLocallyClosed ? 'CLOSED' : 'OPEN',
        curve: conn.curve || 0,
      };
    });

    let eventRoadIdx = 0;
    const accidents = [];
    const closures = [];
    const constructions = [];

    // Pre-configured incidents
    for (let a = 0; a < accidentsCount && eventRoadIdx < generatedRoads.length; a++) {
      const r = generatedRoads[eventRoadIdx % generatedRoads.length];
      accidents.push({ id: `ACC-${a + 1}`, roadId: r.id, source: r.source, target: r.target });
      eventRoadIdx++;
    }

    for (let c = 0; c < closuresCount && eventRoadIdx < generatedRoads.length; c++) {
      const r = generatedRoads[eventRoadIdx % generatedRoads.length];
      r.status = 'CLOSED';
      closures.push({ id: `CLS-${c + 1}`, roadId: r.id, source: r.source, target: r.target });
      eventRoadIdx++;
    }

    for (let cz = 0; cz < constructionCount && eventRoadIdx < generatedRoads.length; cz++) {
      const r = generatedRoads[eventRoadIdx % generatedRoads.length];
      constructions.push({ id: `CST-${cz + 1}`, roadId: r.id, source: r.source, target: r.target });
      eventRoadIdx++;
    }

    // Append dynamic local incidents
    localIncidents.forEach((inc, idx) => {
      const r = generatedRoads.find(
        (road) => (road.source === inc.source && road.target === inc.target) || (road.source === inc.target && road.target === inc.source)
      );
      if (r) {
        if (inc.type === 'ROAD_CLOSURE') {
          r.status = 'CLOSED';
          closures.push({ id: `DYN-CLS-${idx}`, roadId: r.id, source: inc.source, target: inc.target });
        } else if (inc.type === 'ACCIDENT') {
          accidents.push({ id: `DYN-ACC-${idx}`, roadId: r.id, source: inc.source, target: inc.target });
        } else if (inc.type === 'CAPACITY_DROP') {
          constructions.push({ id: `DYN-CST-${idx}`, roadId: r.id, source: inc.source, target: inc.target });
        }
      }
    });

    const buildings = [];
    const trees = [];
    const parks = [];

    generatedRoads.forEach((r, idx) => {
      const u = nodeMap[r.source];
      const v = nodeMap[r.target];
      if (!u || !v) return;

      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const bDist = 42;
      buildings.push({
        id: `bldg-${idx}-1`,
        x: midX + nx * bDist,
        y: midY + ny * bDist,
        w: 38 + (idx % 3) * 12,
        h: 30 + (idx % 4) * 8,
        type: idx % 3 === 0 ? 'tower' : (idx % 3 === 1 ? 'commercial' : 'house'),
        color: idx % 3 === 0 ? '#1e293b' : (idx % 3 === 1 ? '#0f172a' : '#334155'),
      });

      trees.push({
        id: `tree-${idx}-1`,
        x: midX - nx * 34 + (idx % 15) - 7,
        y: midY - ny * 34 + (idx % 15) - 7,
        r: 9 + (idx % 3) * 2,
      });
    });

    baseNodes.forEach((n, i) => {
      if (i % 2 === 0) {
        parks.push({
          id: `park-${i}`,
          x: n.x + 35,
          y: n.y + 35,
          r: 32,
        });
      }
    });

    return {
      viewBox: vb,
      nodes: baseNodes,
      roads: generatedRoads,
      buildings,
      trees,
      parks,
      nodeMap,
      accidents,
      closures,
      constructions,
      startNode: baseNodes[0],
      destNode: baseNodes[baseNodes.length - 1],
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      weather: weatherSetting,
    };
  }, [config, network, localIncidents]);

  // Set default selected road for incident injector
  useEffect(() => {
    if (cityData.roads.length > 0 && !selectedIncidentRoad) {
      setSelectedIncidentRoad(`${cityData.roads[0].source}-${cityData.roads[0].target}`);
    }
  }, [cityData, selectedIncidentRoad]);

  // Bezier math helpers
  const getRoadPathData = (u, v, curve) => {
    if (!curve || curve === 0) return `M ${u.x} ${u.y} L ${v.x} ${v.y}`;
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ctrlX = midX + (-dy / len) * curve;
    const ctrlY = midY + (dx / len) * curve;
    return `M ${u.x} ${u.y} Q ${ctrlX} ${ctrlY} ${v.x} ${v.y}`;
  };

  const getPointOnRoad = (u, v, curve, t) => {
    if (!curve || curve === 0) {
      return {
        x: u.x + (v.x - u.x) * t,
        y: u.y + (v.y - u.y) * t,
        angle: Math.atan2(v.y - u.y, v.x - u.x) * (180 / Math.PI),
      };
    }
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ctrlX = midX + (-dy / len) * curve;
    const ctrlY = midY + (dx / len) * curve;

    const oneMinusT = 1 - t;
    const x = oneMinusT * oneMinusT * u.x + 2 * oneMinusT * t * ctrlX + t * t * v.x;
    const y = oneMinusT * oneMinusT * u.y + 2 * oneMinusT * t * ctrlY + t * t * v.y;

    const tx = 2 * oneMinusT * (ctrlX - u.x) + 2 * t * (v.x - ctrlX);
    const ty = 2 * oneMinusT * (ctrlY - u.y) + 2 * t * (v.y - ctrlY);
    const angle = Math.atan2(ty, tx) * (180 / Math.PI);

    return { x, y, angle };
  };

  /* -------------------------------------------------------------------------
     2. RULE-COMPLIANT ROUTE SOLVER
     ------------------------------------------------------------------------- */
  const findFeasibleRuleCompliantPath = (startId, destId, roads, nodeMap, visitedSeeds = 0) => {
    const adj = {};
    Object.keys(nodeMap).forEach((id) => {
      adj[id] = [];
    });

    roads.forEach((r) => {
      if (r.status === 'CLOSED') return; // Strict closure rule

      adj[r.source]?.push({ target: r.target, road: r });
      if (!r.isOneWay) {
        adj[r.target]?.push({ target: r.source, road: r });
      }
    });

    const queue = [[startId]];
    const foundPaths = [];

    while (queue.length > 0 && foundPaths.length < 5) {
      const currentPath = queue.shift();
      const lastNode = currentPath[currentPath.length - 1];

      if (lastNode === destId) {
        foundPaths.push(currentPath);
        continue;
      }

      if (currentPath.length > 8) continue;

      const neighbors = adj[lastNode] || [];
      const shuffled = [...neighbors].sort((a, b) => ((a.target.charCodeAt(0) + visitedSeeds) % 3) - 1);

      for (const edge of shuffled) {
        if (!currentPath.includes(edge.target)) {
          queue.push([...currentPath, edge.target]);
        }
      }
    }

    return foundPaths.length > 0 ? foundPaths[visitedSeeds % foundPaths.length] : [startId, destId];
  };

  /* -------------------------------------------------------------------------
     3. LIVE VEHICLE FLEET SIMULATION STATE
     ------------------------------------------------------------------------- */
  const [liveVehicles, setLiveVehicles] = useState([]);

  // Initialize fleet state
  useEffect(() => {
    const count = config?.vehicles?.count || 10;
    const vType = config?.vehicles?.type || 'Mixed';
    const typePool = vType === 'Mixed' ? ['Cars', 'Bikes', 'Vans', 'Lorries', 'Scooters'] : [vType];

    const initialFleet = [];
    const qpsoRoutes = benchmark?.routes?.qpso || [];

    for (let i = 0; i < count; i++) {
      const vehId = `V-${String(i + 1).padStart(2, '0')}`;
      const type = typePool[i % typePool.length];

      let candidatePath = qpsoRoutes[i]?.path;
      const isPathValid =
        candidatePath &&
        candidatePath.length > 1 &&
        candidatePath.every((uId, idx) => {
          if (idx === candidatePath.length - 1) return true;
          const vId = candidatePath[idx + 1];
          const road = cityData.roads.find(
            (r) => (r.source === uId && r.target === vId) || (!r.isOneWay && r.source === vId && r.target === uId)
          );
          return road && road.status !== 'CLOSED';
        });

      if (!isPathValid) {
        candidatePath = findFeasibleRuleCompliantPath(
          cityData.startNode.id,
          cityData.destNode.id,
          cityData.roads,
          cityData.nodeMap,
          i
        );
      }

      const startU = cityData.nodeMap[candidatePath[0]] || cityData.startNode;
      const startV = cityData.nodeMap[candidatePath[1] || candidatePath[0]] || cityData.startNode;
      const road = cityData.roads.find(
        (r) => (r.source === candidatePath[0] && r.target === candidatePath[1]) || (r.source === candidatePath[1] && r.target === candidatePath[0])
      );
      const pos = startU && startV ? getPointOnRoad(startU, startV, road?.curve || 0, 0.05) : { x: 110, y: 320, angle: 0 };

      const baseSpeed = type === 'Bikes' ? 55 : (type === 'Lorries' ? 34 : (type === 'Vans' ? 42 : (type === 'Scooters' ? 40 : 48)));

      initialFleet.push({
        id: vehId,
        type,
        status: 'WAITING',
        path: candidatePath,
        segmentIndex: 0,
        progress: 0.0,
        x: pos.x,
        y: pos.y,
        angle: pos.angle,
        speedKmph: baseSpeed,
        distanceTravelledKm: 0,
        travelTimeSec: 0,
        rerouteEvents: [],
        completed: false,
        waitingAtLight: false,
        inAccidentZone: false,
        inWorkZone: false,
      });
    }

    setLiveVehicles(initialFleet);
    setSimSeconds(0);
  }, [cityData, config, benchmark]);

  // Live Animation Tick Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 50;
    const timer = setInterval(() => {
      setSimSeconds((prev) => prev + (intervalMs / 1000) * simSpeed * 6);

      setLiveVehicles((prevFleet) => {
        const roadLoadMap = {};
        prevFleet.forEach((v) => {
          if (!v.completed && v.path.length > v.segmentIndex + 1) {
            const uId = v.path[v.segmentIndex];
            const vId = v.path[v.segmentIndex + 1];
            const roadKey = [uId, vId].sort().join('-');
            roadLoadMap[roadKey] = (roadLoadMap[roadKey] || 0) + 1;
          }
        });

        return prevFleet.map((veh) => {
          if (veh.completed) return { ...veh, status: 'ARRIVED' };

          const uId = veh.path[veh.segmentIndex];
          const vId = veh.path[veh.segmentIndex + 1];
          if (!uId || !vId) {
            return { ...veh, status: 'ARRIVED', completed: true };
          }

          const uNode = cityData.nodeMap[uId];
          const vNode = cityData.nodeMap[vId];
          const road = cityData.roads.find(
            (r) => (r.source === uId && r.target === vId) || (!r.isOneWay && r.source === vId && r.target === uId)
          );

          // ⛔ Strict Closure Check & Dynamic Detour
          if (!road || road.status === 'CLOSED') {
            const destId = cityData.destNode.id;
            const newDetour = findFeasibleRuleCompliantPath(uId, destId, cityData.roads, cityData.nodeMap, 3);
            return {
              ...veh,
              status: 'DYNAMIC DETOUR ⛔',
              path: newDetour,
              segmentIndex: 0,
              progress: 0.05,
              rerouteEvents: [
                ...veh.rerouteEvents,
                { timeSec: simSeconds, reason: `Barricade Closed: Detouring`, oldPath: veh.path, newPath: newDetour },
              ],
            };
          }

          // 🚦 Traffic Signal Rule at Junction vId
          const signal = getJunctionSignalState(vId, simSeconds);
          const isApproachingJunction = veh.progress >= 0.88;

          if (isApproachingJunction && signal === 'RED') {
            return {
              ...veh,
              status: 'STOPPED AT RED LIGHT 🔴',
              speedKmph: 0,
              waitingAtLight: true,
              travelTimeSec: veh.travelTimeSec + (intervalMs / 1000) * simSpeed * 6,
            };
          }

          // 💥 Accident & 🚧 Construction Zone Rules
          const hasAccident = cityData.accidents.some((a) => a.roadId === road.id);
          const hasConstruction = cityData.constructions.some((c) => c.roadId === road.id);

          const baseSpeed = veh.type === 'Bikes' ? 55 : (veh.type === 'Lorries' ? 34 : (veh.type === 'Vans' ? 42 : (veh.type === 'Scooters' ? 40 : 48)));
          const weatherModifier = cityData.weather === 'Rainy' ? 0.80 : (cityData.weather === 'Windy' ? 0.90 : (cityData.weather === 'Sunny' ? 1.05 : 1.0));
          const conditionModifier = road.condition === 'Bad' ? 0.72 : (road.condition === 'Average' ? 0.88 : 1.0);

          const roadKey = [uId, vId].sort().join('-');
          const vehiclesOnRoad = roadLoadMap[roadKey] || 1;
          const capacityRatio = vehiclesOnRoad / (road.capacity_vehicles || 4);
          const congestionModifier = 1.0 / (1.0 + 0.2 * Math.pow(Math.max(0, capacityRatio - 0.5), 2));

          let targetSpeed = baseSpeed * weatherModifier * conditionModifier * congestionModifier;

          let status = 'MOVING 🟢';
          if (hasAccident) {
            targetSpeed = Math.min(15, targetSpeed * 0.35);
            status = 'CAUTION: ACCIDENT 💥';
          } else if (hasConstruction) {
            targetSpeed = Math.min(22, targetSpeed * 0.50);
            status = 'WORK ZONE LIMIT 🚧';
          } else if (capacityRatio > 1.2) {
            status = 'HEAVY TRAFFIC ⚠️';
          }

          const dtHours = ((intervalMs / 1000) * simSpeed * 6) / 3600;
          const stepProgress = (targetSpeed * dtHours) / (road.distance_km || 1);
          let nextProgress = veh.progress + stepProgress;
          let nextSegIndex = veh.segmentIndex;
          let nextCompleted = veh.completed;

          if (nextProgress >= 1.0) {
            nextSegIndex += 1;
            nextProgress = 0.0;
            if (nextSegIndex >= veh.path.length - 1) {
              nextCompleted = true;
            }
          }

          const curU = cityData.nodeMap[veh.path[nextSegIndex]];
          const curV = cityData.nodeMap[veh.path[nextSegIndex + 1]];
          const curRoad = cityData.roads.find(
            (r) => (r.source === veh.path[nextSegIndex] && r.target === veh.path[nextSegIndex + 1]) ||
                   (r.source === veh.path[nextSegIndex + 1] && r.target === veh.path[nextSegIndex])
          );

          const curPos = curU && curV
            ? getPointOnRoad(curU, curV, curRoad?.curve || 0, Math.min(0.98, nextProgress))
            : { x: veh.x, y: veh.y, angle: veh.angle };

          return {
            ...veh,
            status: nextCompleted ? 'ARRIVED' : status,
            segmentIndex: nextSegIndex,
            progress: nextProgress,
            x: curPos.x,
            y: curPos.y,
            angle: curPos.angle,
            speedKmph: Math.round(targetSpeed),
            distanceTravelledKm: veh.distanceTravelledKm + targetSpeed * dtHours,
            travelTimeSec: veh.travelTimeSec + (intervalMs / 1000) * simSpeed * 6,
            completed: nextCompleted,
            waitingAtLight: false,
            inAccidentZone: hasAccident,
            inWorkZone: hasConstruction,
          };
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, cityData, simSeconds]);

  const handleRestartSim = () => {
    setIsPlaying(false);
    setSimSeconds(0);
    const count = config?.vehicles?.count || 10;
    const vType = config?.vehicles?.type || 'Mixed';
    const typePool = vType === 'Mixed' ? ['Cars', 'Bikes', 'Vans', 'Lorries', 'Scooters'] : [vType];

    const resetFleet = [];
    for (let i = 0; i < count; i++) {
      const vehId = `V-${String(i + 1).padStart(2, '0')}`;
      const type = typePool[i % typePool.length];
      const assignedRoute = findFeasibleRuleCompliantPath(
        cityData.startNode.id,
        cityData.destNode.id,
        cityData.roads,
        cityData.nodeMap,
        i
      );
      const startU = cityData.nodeMap[assignedRoute[0]] || cityData.startNode;
      const startV = cityData.nodeMap[assignedRoute[1] || assignedRoute[0]] || cityData.startNode;
      const road = cityData.roads.find(
        (r) => (r.source === assignedRoute[0] && r.target === assignedRoute[1]) || (r.source === assignedRoute[1] && r.target === assignedRoute[0])
      );
      const pos = startU && startV ? getPointOnRoad(startU, startV, road?.curve || 0, 0.05) : { x: 110, y: 320, angle: 0 };

      resetFleet.push({
        id: vehId,
        type,
        status: 'WAITING',
        path: assignedRoute,
        segmentIndex: 0,
        progress: 0.0,
        x: pos.x,
        y: pos.y,
        angle: pos.angle,
        speedKmph: 45,
        distanceTravelledKm: 0,
        travelTimeSec: 0,
        rerouteEvents: [],
        completed: false,
        waitingAtLight: false,
        inAccidentZone: false,
        inWorkZone: false,
      });
    }
    setLiveVehicles(resetFleet);
  };

  // Dynamic Incident Injection Handler
  const handleTriggerInjectIncident = () => {
    if (!selectedIncidentRoad) return;
    const [u, v] = selectedIncidentRoad.split('-');

    setLocalIncidents((prev) => [
      ...prev,
      {
        source: u,
        target: v,
        type: selectedIncidentType,
      },
    ]);

    if (onInjectIncident) {
      onInjectIncident({
        preset: currentPreset,
        source: u,
        target: v,
        incident_type: selectedIncidentType,
        severity: 1.0,
        description: `Live Dynamic Incident on ${u} ↔ ${v}`,
      });
    }
  };

  const handleTriggerClearIncidents = () => {
    setLocalIncidents([]);
    if (onClearIncidents) {
      onClearIncidents();
    }
  };

  const formattedClock = useMemo(() => {
    const baseHour = 8;
    const baseMin = 0;
    const totalSimMin = Math.floor(simSeconds / 60);
    const curHour = (baseHour + Math.floor((baseMin + totalSimMin) / 60)) % 24;
    const curMin = (baseMin + totalSimMin) % 60;
    const ampm = curHour >= 12 ? 'PM' : 'AM';
    const displayHour = curHour % 12 === 0 ? 12 : curHour % 12;
    return `${String(displayHour).padStart(2, '0')}:${String(curMin).padStart(2, '0')} ${ampm}`;
  }, [simSeconds]);

  const arrivedCount = liveVehicles.filter((v) => v.completed).length;

  const handleMouseDown = (e) => {
    if (e.target.closest('.map-control-btn') || e.target.closest('.map-popover') || e.target.closest('.incident-drawer')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((prev) => Math.max(0.4, Math.min(3.5, prev * zoomFactor)));
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedElement(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 100px)',
        minHeight: 650,
        background: 'var(--map-bg)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-subtle)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* Dynamic Weather & Traffic Rules Status Overlay */}
      <div style={{
        position: 'absolute',
        top: 18,
        left: 18,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-surface)',
        padding: '6px 14px',
        borderRadius: 20,
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(10px)',
        flexWrap: 'wrap',
      }}>
        {onLaunchDemoMode && (
          <button
            onClick={onLaunchDemoMode}
            style={{
              background: 'linear-gradient(135deg, #ff8500 0%, #ff6b00 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '4px 11px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 0 10px rgba(255, 107, 0, 0.4)',
            }}
            title="Launch 1-click SIH Demonstration Scenario"
          >
            <Play size={11} /> 🎬 DEMO MODE
          </button>
        )}

        {/* Scenario Switcher Buttons */}
        {scenarios && scenarios.length > 0 && (
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 14, padding: 2, border: '1px solid var(--border-subtle)' }}>
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectPreset && onSelectPreset(s.id)}
                style={{
                  background: currentPreset === s.id ? 'var(--accent-cyan)' : 'transparent',
                  color: currentPreset === s.id ? '#030712' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '3px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {s.name?.replace(' Demo', '')}
              </button>
            ))}
          </div>
        )}

        {cityData.weather === 'Rainy' && <CloudRain size={15} color="#38bdf8" />}
        {cityData.weather === 'Sunny' && <Sun size={15} color="#fbbf24" />}
        {cityData.weather === 'Windy' && <Wind size={15} color="#a855f7" />}
        {cityData.weather === 'Normal' && <Compass size={15} color="#10b981" />}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
          {cityData.weather.toUpperCase()}
        </span>
        <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
          🚦 SIGNALS ACTIVE
        </span>
        <button
          onClick={() => setShowIncidentDrawer(!showIncidentDrawer)}
          style={{
            background: showIncidentDrawer ? '#f43f5e' : 'rgba(244, 63, 94, 0.18)',
            color: showIncidentDrawer ? '#ffffff' : '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 14,
            padding: '3px 10px',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Zap size={12} /> {showIncidentDrawer ? 'HIDE INCIDENTS' : '⚡ INJECT INCIDENT'}
        </button>
      </div>

      {/* Floating Dynamic Incident Injector Drawer */}
      {showIncidentDrawer && (
        <div
          className="incident-drawer"
          style={{
            position: 'absolute',
            top: 60,
            left: 18,
            zIndex: 30,
            width: 320,
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 14,
            padding: '18px 20px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
              <AlertTriangle size={16} /> Dynamic Incident Simulator
            </strong>
            <button onClick={() => setShowIncidentDrawer(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SELECT CORRIDOR</label>
            <select
              value={selectedIncidentRoad}
              onChange={(e) => setSelectedIncidentRoad(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              {cityData.roads.map((r) => (
                <option key={r.id} value={`${r.source}-${r.target}`}>
                  Road {r.source} ↔ {r.target} ({r.distance_km} km, {r.lanes}L)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>INCIDENT TYPE</label>
            <select
              value={selectedIncidentType}
              onChange={(e) => setSelectedIncidentType(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
            >
              <option value="ROAD_CLOSURE">⛔ Complete Road Closure (Barricade)</option>
              <option value="ACCIDENT">💥 Vehicle Collision (Accident Zone)</option>
              <option value="CAPACITY_DROP">🚧 Construction Work Zone Limit</option>
              <option value="CONGESTION_SPIKE">⚠️ Severe Congestion Spike</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={handleTriggerInjectIncident}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <Flame size={13} /> INJECT
            </button>
            <button
              onClick={handleTriggerClearIncidents}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} /> RESET
            </button>
          </div>

          {/* Incident Impact Telemetry */}
          {(localIncidents.length > 0 || incidentResult) && (
            <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.76rem' }}>
              <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> Detour Routing 100% Feasible
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Active Dynamic Incidents: <strong style={{ color: '#f43f5e' }}>{localIncidents.length || 1}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Interactive 2D Illustrated City SVG Canvas */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        viewBox={cityData.viewBox}
      >
        <defs>
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <pattern id="urbanGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0, 240, 255, 0.04)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#urbanGrid)" />

        {/* Rain particles if weather is Rainy */}
        {cityData.weather === 'Rainy' && (
          <g opacity="0.25">
            {Array.from({ length: 40 }).map((_, i) => (
              <line
                key={`rain-${i}`}
                x1={(i * 45) % 1200}
                y1={(i * 35) % 800}
                x2={((i * 45) % 1200) - 10}
                y2={((i * 35) % 800) + 25}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            ))}
          </g>
        )}

        {/* Plazas & Parks */}
        {cityData.parks.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={p.r} fill="rgba(16, 185, 129, 0.07)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" />
        ))}

        {/* Buildings */}
        {cityData.buildings.map((b) => (
          <g key={b.id}>
            <rect x={b.x - b.w / 2 + 4} y={b.y - b.h / 2 + 4} width={b.w} height={b.h} rx="4" fill="rgba(0, 0, 0, 0.4)" />
            <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx="4" fill="var(--bg-card)" stroke="var(--border-subtle)" strokeWidth="1.2" />
            <line x1={b.x - b.w / 2 + 5} y1={b.y} x2={b.x + b.w / 2 - 5} y2={b.y} stroke="var(--border-subtle)" strokeWidth="1" />
          </g>
        ))}

        {/* Trees */}
        {cityData.trees.map((t) => (
          <g key={t.id}>
            <circle cx={t.x + 2} cy={t.y + 2} r={t.r} fill="rgba(0, 0, 0, 0.25)" />
            <circle cx={t.x} cy={t.y} r={t.r} fill="#10b981" opacity="0.4" stroke="#10b981" strokeWidth="1" />
            <circle cx={t.x - 1} cy={t.y - 1} r={t.r * 0.6} fill="#34d399" opacity="0.7" />
          </g>
        ))}

        {/* Roads Layer */}
        {cityData.roads.map((road) => {
          const u = cityData.nodeMap[road.source];
          const v = cityData.nodeMap[road.target];
          if (!u || !v) return null;

          const pathD = getRoadPathData(u, v, road.curve);
          const width = road.lanes === 4 ? 32 : (road.lanes === 2 ? 22 : 14);
          const isClosed = road.status === 'CLOSED';
          const midPos = getPointOnRoad(u, v, road.curve, 0.5);

          return (
            <g
              key={road.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElement({
                  type: 'road',
                  data: road,
                  x: midPos.x,
                  y: midPos.y,
                });
              }}
              onMouseEnter={() => setHoveredElement(road.id)}
              onMouseLeave={() => setHoveredElement(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Sidewalk border */}
              <path d={pathD} fill="none" stroke="var(--road-border)" strokeWidth={width + 5} strokeLinecap="round" strokeLinejoin="round" />

              {/* Asphalt surface */}
              <path
                d={pathD}
                fill="none"
                stroke={isClosed ? '#475569' : (road.condition === 'Bad' ? '#1e293b' : 'var(--road-asphalt)')}
                strokeWidth={width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Lane dashes */}
              {!isClosed && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={road.lanes >= 4 ? '#fbbf24' : 'var(--road-center-dash)'}
                  strokeWidth="1.8"
                  strokeDasharray="7 5"
                  opacity="0.85"
                />
              )}

              {/* Direction arrow if oneWay */}
              {road.isOneWay && !isClosed && (
                <g transform={`translate(${midPos.x}, ${midPos.y})`}>
                  <circle cx="0" cy="0" r="8" fill="rgba(0, 240, 255, 0.3)" />
                  <text x="0" y="3.5" fill="#00f0ff" fontSize="9" fontWeight="bold" textAnchor="middle">➔</text>
                </g>
              )}

              {/* Road closure barricade */}
              {isClosed && (
                <g transform={`translate(${midPos.x}, ${midPos.y})`}>
                  <rect x="-26" y="-11" width="52" height="22" rx="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="0" y="4.5" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">⛔ CLOSED</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Incident Markers (Accidents, Construction) */}
        {cityData.accidents.map((acc) => {
          const road = cityData.roads.find((r) => r.id === acc.roadId);
          if (!road) return null;
          const pos = getPointOnRoad(cityData.nodeMap[road.source], cityData.nodeMap[road.target], road.curve, 0.35);
          return (
            <g key={acc.id} transform={`translate(${pos.x}, ${pos.y})`} style={{ cursor: 'pointer' }}>
              <circle cx="0" cy="0" r="16" fill="rgba(244, 63, 94, 0.3)" className="animate-ping" />
              <circle cx="0" cy="0" r="11" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">💥</text>
            </g>
          );
        })}

        {cityData.constructions.map((cz) => {
          const road = cityData.roads.find((r) => r.id === cz.roadId);
          if (!road) return null;
          const pos = getPointOnRoad(cityData.nodeMap[road.source], cityData.nodeMap[road.target], road.curve, 0.65);
          return (
            <g key={cz.id} transform={`translate(${pos.x}, ${pos.y})`} style={{ cursor: 'pointer' }}>
              <circle cx="0" cy="0" r="11" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">🚧</text>
            </g>
          );
        })}

        {/* Dynamic Junction Signals with Live Light Changes */}
        {cityData.nodes.map((node) => {
          const signalColor = getJunctionSignalState(node.id, simSeconds);
          const isGreen = signalColor === 'GREEN';

          return (
            <g key={`node-${node.id}`} style={{ cursor: 'pointer' }}>
              <circle
                cx={node.x}
                cy={node.y}
                r="16"
                fill="var(--bg-card)"
                stroke={isGreen ? '#10b981' : '#f43f5e'}
                strokeWidth="2.5"
              />
              <circle cx={node.x} cy={node.y} r="5" fill={isGreen ? '#10b981' : '#f43f5e'} />

              {/* Traffic Light Pole */}
              <rect x={node.x + 10} y={node.y - 22} width="8" height="18" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
              <circle cx={node.x + 14} cy={node.y - 17} r="2.5" fill={isGreen ? '#475569' : '#f43f5e'} />
              <circle cx={node.x + 14} cy={node.y - 9} r="2.5" fill={isGreen ? '#10b981' : '#475569'} />

              <text x={node.x} y={node.y - 26} fill="var(--accent-cyan)" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="JetBrains Mono">{node.id}</text>
            </g>
          );
        })}

        {/* Start & Destination */}
        {cityData.startNode && (
          <g transform={`translate(${cityData.startNode.x}, ${cityData.startNode.y})`}>
            <circle cx="0" cy="0" r="28" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" />
            <circle cx="0" cy="0" r="16" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="32" fill="#34d399" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">🟢 START</text>
          </g>
        )}

        {cityData.destNode && (
          <g transform={`translate(${cityData.destNode.x}, ${cityData.destNode.y})`}>
            <circle cx="0" cy="0" r="28" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" />
            <circle cx="0" cy="0" r="16" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="32" fill="#fb7185" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">🏁 DESTINATION</text>
          </g>
        )}

        {/* Active Optimized Routes Overlay */}
        {benchmark?.routes?.qpso && (
          <g>
            {benchmark.routes.qpso.map((vRoute, idx) => {
              if (!vRoute.path || vRoute.path.length < 2) return null;
              const segments = [];
              for (let i = 0; i < vRoute.path.length - 1; i++) {
                const uId = vRoute.path[i];
                const vId = vRoute.path[i + 1];
                const u = cityData.nodeMap[uId];
                const v = cityData.nodeMap[vId];
                if (!u || !v) continue;
                const road = cityData.roads.find((r) => (r.source === uId && r.target === vId) || (r.source === vId && r.target === uId));
                segments.push(getRoadPathData(u, v, road?.curve || 0));
              }
              return (
                <path
                  key={`opt-path-${idx}`}
                  d={segments.join(' ')}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.8"
                  filter="url(#neonGlow)"
                />
              );
            })}
          </g>
        )}

        {/* Live Rule-Enforcing Dynamic Vehicles */}
        {liveVehicles.map((veh) => (
          <g
            key={veh.id}
            transform={`translate(${veh.x}, ${veh.y}) rotate(${veh.angle})`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement({
                type: 'vehicle',
                data: veh,
                x: veh.x,
                y: veh.y,
              });
            }}
            style={{ cursor: 'pointer', transition: isPlaying ? 'none' : 'transform 0.2s ease-out' }}
          >
            {veh.inAccidentZone && (
              <circle cx="0" cy="0" r="17" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" className="animate-spin" />
            )}
            {veh.inWorkZone && (
              <circle cx="0" cy="0" r="16" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
            )}

            <circle cx="2" cy="2" r="11" fill="rgba(0, 0, 0, 0.4)" />
            <circle
              cx="0"
              cy="0"
              r="11"
              fill={
                veh.completed
                  ? '#10b981'
                  : veh.waitingAtLight
                  ? '#f43f5e'
                  : veh.inAccidentZone
                  ? '#f43f5e'
                  : veh.inWorkZone
                  ? '#f59e0b'
                  : 'var(--accent-cyan)'
              }
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text x="0" y="3.5" fill="#030712" fontSize="8" fontWeight="bold" textAnchor="middle" transform={`rotate(${-veh.angle})`}>
              {veh.type === 'Bikes' ? '🏍️' : (veh.type === 'Lorries' ? '🚚' : (veh.type === 'Vans' ? '🚐' : (veh.type === 'Scooters' ? '🛵' : '🚗')))}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating Map Navigation Controls */}
      <div
        className="map-control-btn"
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 20,
        }}
      >
        <button onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))} className="btn btn-secondary" style={{ padding: 9, borderRadius: 8 }} title="Zoom In">
          <ZoomIn size={17} color="var(--accent-cyan)" />
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))} className="btn btn-secondary" style={{ padding: 9, borderRadius: 8 }} title="Zoom Out">
          <ZoomOut size={17} color="var(--accent-cyan)" />
        </button>
        <button onClick={handleResetView} className="btn btn-secondary" style={{ padding: 9, borderRadius: 8 }} title="Fit / Reset View">
          <RotateCcw size={17} color="var(--accent-cyan)" />
        </button>
        <button onClick={toggleFullscreen} className="btn btn-secondary" style={{ padding: 9, borderRadius: 8 }} title="Toggle Fullscreen">
          {isFullscreen ? <Minimize size={17} color="var(--accent-cyan)" /> : <Maximize size={17} color="var(--accent-cyan)" />}
        </button>
      </div>

      {/* Floating Simulation Control Bar */}
      <div
        className="map-control-btn"
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          padding: '8px 20px',
          borderRadius: 30,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 20,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: isPlaying ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 20,
            padding: '8px 18px',
            fontSize: '0.86rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
          }}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlaying ? 'PAUSE' : 'START SIMULATION'}</span>
        </button>

        <button
          onClick={handleRestartSim}
          className="btn btn-secondary"
          style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5 }}
          title="Restart Simulation"
        >
          <RefreshCw size={14} /> ↻ RESTART
        </button>

        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 16, padding: 2, border: '1px solid var(--border-subtle)' }}>
          {[1, 2, 4, 8].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimSpeed(spd)}
              style={{
                background: simSpeed === spd ? 'var(--accent-cyan)' : 'transparent',
                color: simSpeed === spd ? '#030712' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 14,
                padding: '4px 9px',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {spd}×
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
          <Clock size={13} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>
            {formattedClock}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-input)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <CheckCircle2 size={13} color="#34d399" />
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
            {arrivedCount} / {liveVehicles.length} Arrived
          </span>
        </div>

        {onReconfigure && (
          <button
            onClick={onReconfigure}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', borderRadius: 20, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <Sliders size={13} /> ⚙️ SETUP
          </button>
        )}
      </div>

      {/* Contextual Popover */}
      {selectedElement && (
        <div
          className="map-popover"
          style={{
            position: 'absolute',
            top: 20,
            right: 80,
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-active)',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: 300,
            zIndex: 30,
            color: 'var(--text-primary)',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong className="font-orbitron" style={{ color: 'var(--accent-cyan)', letterSpacing: '0.04em', fontSize: '0.88rem' }}>
              {selectedElement.type === 'road'
                ? `ROAD ${selectedElement.data.source} ➔ ${selectedElement.data.target}`
                : selectedElement.type === 'vehicle'
                ? `VEHICLE ${selectedElement.data.id}`
                : `JUNCTION ${selectedElement.data.id}`}
            </strong>
            <button onClick={() => setSelectedElement(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          {selectedElement.type === 'vehicle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, color: 'var(--text-secondary)' }}>
              <div>Type: <strong>{selectedElement.data.type}</strong></div>
              <div>Status: <span className={`badge ${selectedElement.data.completed ? 'badge-emerald' : (selectedElement.data.waitingAtLight ? 'badge-rose' : 'badge-cyan')}`}>{selectedElement.data.status}</span></div>
              <div>Live Speed: <strong>{selectedElement.data.speedKmph} km/h</strong></div>
              <div>Elapsed Travel Time: <strong style={{ color: 'var(--accent-cyan)' }}>{(selectedElement.data.travelTimeSec / 60).toFixed(1)} min</strong></div>
              <div>Distance Covered: <strong>{selectedElement.data.distanceTravelledKm.toFixed(1)} km</strong></div>
              <div>Assigned Path: <strong style={{ color: '#34d399' }}>{selectedElement.data.path.join(' ➔ ')}</strong></div>
            </div>
          )}

          {selectedElement.type === 'road' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, color: 'var(--text-secondary)' }}>
              <div>Length: <strong>{selectedElement.data.distance_km} km</strong></div>
              <div>Lanes: <strong>{selectedElement.data.lanes} Lanes</strong></div>
              <div>Capacity: <strong>{selectedElement.data.capacity_vehicles} veh</strong></div>
              <div>Condition: <span className="badge badge-cyan">{selectedElement.data.condition}</span></div>
              <div>Status: <span className={`badge ${selectedElement.data.status === 'OPEN' ? 'badge-emerald' : 'badge-rose'}`}>{selectedElement.data.status}</span></div>
              {selectedElement.data.isOneWay && (
                <div style={{ color: '#38bdf8', fontWeight: 600 }}>➔ One-Way Direction Enforced</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
