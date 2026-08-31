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
} from 'lucide-react';

/* =========================================================================
   2D ILLUSTRATED SIMULATED CITY MAP ENGINE (PHASE 2 - SIH26137)
   Dynamic City Transportation Map generated from Phase 1 SimulationConfig.
   ========================================================================= */

export default function CitySimulationMap({
  config,
  network,
  traffic,
  vehicles = [],
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
  const [selectedElement, setSelectedElement] = useState(null); // { type, data, x, y }

  // Hover state
  const [hoveredElement, setHoveredElement] = useState(null);

  /* -------------------------------------------------------------------------
     1. DYNAMIC CITY GENERATOR BASED ON SIMULATION CONFIG
     ------------------------------------------------------------------------- */
  const cityData = useMemo(() => {
    // Determine base nodes and dimensions based on Network Size & Density
    const sizeSetting = config?.roadNetwork?.size || 'Medium';
    const densitySetting = config?.roadNetwork?.density || 'Medium';
    const oneWaySetting = config?.roadNetwork?.oneWay || 'OFF';
    const capacitySetting = config?.roadNetwork?.roadCapacity || 'Medium';
    const conditionSetting = config?.conditions?.roadCondition || 'Average';
    const accidentsCount = config?.events?.accidents || 0;
    const closuresCount = config?.events?.roadClosures || 0;
    const constructionCount = config?.events?.constructionZones || 0;

    // Node layout geometry: Natural curved urban layout (not a rigid grid)
    let baseNodes = [];
    if (sizeSetting === 'Low') {
      baseNodes = [
        { id: 'A', x: 120, y: 320, name: 'Origin Terminal (A)' },
        { id: 'B', x: 280, y: 160, name: 'North Arterial (B)' },
        { id: 'C', x: 300, y: 460, name: 'South Transit (C)' },
        { id: 'D', x: 480, y: 220, name: 'Central Boulevard (D)' },
        { id: 'E', x: 500, y: 420, name: 'Midtown Hub (E)' },
        { id: 'F', x: 680, y: 310, name: 'Destination Gateway (F)' },
      ];
    } else if (sizeSetting === 'High') {
      baseNodes = [
        { id: 'A', x: 80, y: 340, name: 'West Commercial Terminal' },
        { id: 'B', x: 220, y: 160, name: 'North Ring Jct' },
        { id: 'C', x: 230, y: 490, name: 'South Logistics Jct' },
        { id: 'D', x: 380, y: 120, name: 'Cyber Park Interchange' },
        { id: 'E', x: 410, y: 330, name: 'Central Plaza Hub' },
        { id: 'F', x: 390, y: 530, name: 'Riverside Corridor' },
        { id: 'G', x: 580, y: 180, name: 'Tech Gateway North' },
        { id: 'H', x: 600, y: 460, name: 'Industrial Parkway' },
        { id: 'I', x: 740, y: 240, name: 'Metro East Overpass' },
        { id: 'J', x: 770, y: 440, name: 'South Harbor Arterial' },
        { id: 'K', x: 920, y: 330, name: 'National Logistics Hub (Dest)' },
      ];
    } else {
      // Default: Medium 9-Node Urban Network
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

    // Base road connections with curved geometry
    const rawConnections = [];
    if (sizeSetting === 'Low') {
      rawConnections.push(
        { u: 'A', v: 'B', lanes: 2, curve: -20 },
        { u: 'A', v: 'C', lanes: 2, curve: 20 },
        { u: 'B', v: 'D', lanes: 4, curve: 0 },
        { u: 'C', v: 'E', lanes: 2, curve: 0 },
        { u: 'D', v: 'E', lanes: 2, curve: 10 },
        { u: 'D', v: 'F', lanes: 4, curve: -15 },
        { u: 'E', v: 'F', lanes: 2, curve: 15 }
      );
    } else if (sizeSetting === 'High') {
      rawConnections.push(
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
        { u: 'I', v: 'J', lanes: 2, curve: 0 }
      );
    } else {
      // Medium 9-Node Default
      rawConnections.push(
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
        { u: 'E', v: 'I', lanes: 4, curve: 0 }
      );
    }

    // Adjust lane distribution based on capacity setting
    const generatedRoads = rawConnections.map((conn, idx) => {
      const u = nodeMap[conn.u];
      const v = nodeMap[conn.v];
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const lengthKm = Math.round((Math.sqrt(dx * dx + dy * dy) / 75) * 10) / 10;

      let lanes = conn.lanes;
      if (capacitySetting === 'Low') lanes = Math.min(2, lanes);
      if (capacitySetting === 'High' && idx % 2 === 0) lanes = 4;

      const isOneWay = oneWaySetting === 'ON' && (idx % 3 === 0);
      const condition = idx % 5 === 0 ? 'Bad' : (idx % 3 === 0 ? 'Average' : 'Good');

      return {
        id: `R-${conn.u}${conn.v}`,
        source: conn.u,
        target: conn.v,
        distance_km: lengthKm,
        lanes: lanes,
        capacity_vehicles: lanes === 4 ? 12 : (lanes === 2 ? 6 : 3),
        free_flow_speed_kmph: lanes === 4 ? 60 : (lanes === 2 ? 45 : 30),
        isOneWay: isOneWay,
        condition: condition,
        status: 'OPEN',
        curve: conn.curve,
      };
    });

    // Inject Disruption Events onto roads
    let eventRoadIdx = 0;
    const accidents = [];
    const closures = [];
    const constructions = [];

    // 1. Accidents
    for (let a = 0; a < accidentsCount && eventRoadIdx < generatedRoads.length; a++) {
      const r = generatedRoads[eventRoadIdx % generatedRoads.length];
      accidents.push({ id: `ACC-${a + 1}`, roadId: r.id, source: r.source, target: r.target });
      eventRoadIdx++;
    }

    // 2. Road Closures (Marks road as CLOSED in computational graph)
    for (let c = 0; c < closuresCount && eventRoadIdx < generatedRoads.length; c++) {
      const r = generatedRoads[eventRoadIdx % generatedRoads.length];
      r.status = 'CLOSED';
      closures.push({ id: `CLS-${c + 1}`, roadId: r.id, source: r.source, target: r.target });
      eventRoadIdx++;
    }

    // 3. Construction Zones
    for (let cz = 0; cz < constructionCount && eventRoadIdx < generatedRoads.length; cz++) {
      const r = generatedRoads[eventRoadIdx % generatedRoads.length];
      constructions.push({ id: `CST-${cz + 1}`, roadId: r.id, source: r.source, target: r.target });
      eventRoadIdx++;
    }

    // Procedural Contextual Illustrated City Elements: Buildings, Trees, Parks, Water Pond
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

      // 🏢 Buildings alongside roads
      const bDist = 42;
      buildings.push({
        id: `bldg-${idx}-1`,
        x: midX + nx * bDist,
        y: midY + ny * bDist,
        w: 38 + (idx % 3) * 12,
        h: 30 + (idx % 4) * 8,
        type: idx % 3 === 0 ? 'tower' : (idx % 3 === 1 ? 'commercial' : 'house'),
        color: idx % 3 === 0 ? '#1e293b' : (idx % 3 === 1 ? '#0f172a' : '#334155'),
        roofColor: idx % 3 === 0 ? '#00f0ff' : (idx % 3 === 1 ? '#0284c7' : '#38bdf8'),
      });

      // 🌳 Trees & Greenery Pockets
      trees.push({
        id: `tree-${idx}-1`,
        x: midX - nx * 34 + (idx % 15) - 7,
        y: midY - ny * 34 + (idx % 15) - 7,
        r: 9 + (idx % 3) * 2,
      });
      trees.push({
        id: `tree-${idx}-2`,
        x: midX + nx * 70,
        y: midY + ny * 70,
        r: 8 + (idx % 2) * 2,
      });
    });

    // Add Landscaped Parks near junctions
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
    };
  }, [config]);

  // Handle Mouse Pan & Drag
  const handleMouseDown = (e) => {
    if (e.target.closest('.map-control-btn') || e.target.closest('.map-popover')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Scroll Wheel Zoom
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
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Helper to calculate SVG bezier curved path string
  const getRoadPathData = (u, v, curve) => {
    if (!curve || curve === 0) {
      return `M ${u.x} ${u.y} L ${v.x} ${v.y}`;
    }
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ctrlX = midX + nx * curve;
    const ctrlY = midY + ny * curve;
    return `M ${u.x} ${u.y} Q ${ctrlX} ${ctrlY} ${v.x} ${v.y}`;
  };

  // Position interpolation along road
  const getPointOnRoad = (u, v, curve, t) => {
    if (!curve || curve === 0) {
      return {
        x: u.x + (v.x - u.x) * t,
        y: u.y + (v.y - u.y) * t,
      };
    }
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ctrlX = midX + (-dy / len) * curve;
    const ctrlY = midY + (dx / len) * curve;

    // Quadratic Bezier Formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT * oneMinusT * u.x + 2 * oneMinusT * t * ctrlX + t * t * v.x,
      y: oneMinusT * oneMinusT * u.y + 2 * oneMinusT * t * ctrlY + t * t * v.y,
    };
  };

  // Vehicles distribution
  const renderedVehicles = useMemo(() => {
    if (!cityData.roads.length) return [];
    const count = config?.vehicles?.count || 10;
    const vType = config?.vehicles?.type || 'Mixed';
    const trafficPattern = config?.traffic?.pattern || 'Random';
    const list = [];

    const typePool = vType === 'Mixed' ? ['Cars', 'Bikes', 'Vans', 'Lorries', 'Scooters'] : [vType];

    const openRoads = cityData.roads.filter((r) => r.status === 'OPEN');
    if (!openRoads.length) return [];

    for (let i = 0; i < count; i++) {
      const roadIdx = trafficPattern === 'Equally Distributed' ? (i % openRoads.length) : ((i * 3 + 1) % openRoads.length);
      const road = openRoads[roadIdx];
      const u = cityData.nodeMap[road.source];
      const v = cityData.nodeMap[road.target];
      if (!u || !v) continue;

      const t = 0.15 + ((i * 0.22) % 0.7);
      const pos = getPointOnRoad(u, v, road.curve, t);
      const type = typePool[i % typePool.length];

      list.push({
        id: `V-${i + 1}`,
        type,
        x: pos.x,
        y: pos.y,
        roadId: road.id,
        road,
      });
    }
    return list;
  }, [cityData, config]);

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
        background: 'radial-gradient(circle at 50% 50%, #061022 0%, #030712 100%)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 16px 50px rgba(0,0,0,0.85), 0 0 30px rgba(0, 240, 255, 0.15)',
        border: '1px solid rgba(0, 240, 255, 0.3)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* 1. Full-Screen Interactive 2D Illustrated City SVG Canvas */}
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
          {/* Cyber Neon Glow Filter */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Road Asphalt Texture */}
          <linearGradient id="roadAsphalt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Grid Blueprint Texture */}
          <pattern id="urbanGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0, 240, 255, 0.04)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Global Blueprint Grid */}
        <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#urbanGrid)" />

        {/* Subtle Concentric Radar Rings in Background */}
        <g transform={`translate(${cityData.centerX}, ${cityData.centerY})`}>
          <circle cx="0" cy="0" r="360" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1.5" strokeDasharray="16 8" />
          <circle cx="0" cy="0" r="240" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="1" strokeDasharray="8 6" />
        </g>

        {/* --- Landscaped Green Parks & Plazas --- */}
        {cityData.parks.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill="rgba(16, 185, 129, 0.07)"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="1.5"
          />
        ))}

        {/* --- 2D Illustrated Urban Buildings --- */}
        {cityData.buildings.map((b) => (
          <g key={b.id}>
            {/* Building Ground Shadow */}
            <rect x={b.x - b.w / 2 + 4} y={b.y - b.h / 2 + 4} width={b.w} height={b.h} rx="4" fill="rgba(0, 0, 0, 0.5)" />
            {/* Building Body */}
            <rect
              x={b.x - b.w / 2}
              y={b.y - b.h / 2}
              width={b.w}
              height={b.h}
              rx="4"
              fill={b.color}
              stroke="rgba(0, 240, 255, 0.25)"
              strokeWidth="1.2"
            />
            {/* Illuminated Windows / Roof Accent */}
            <line x1={b.x - b.w / 2 + 5} y1={b.y} x2={b.x + b.w / 2 - 5} y2={b.y} stroke="rgba(0, 240, 255, 0.35)" strokeWidth="1" />
          </g>
        ))}

        {/* --- Green Trees with Leaf Shading --- */}
        {cityData.trees.map((t) => (
          <g key={t.id}>
            <circle cx={t.x + 2} cy={t.y + 2} r={t.r} fill="rgba(0, 0, 0, 0.3)" />
            <circle cx={t.x} cy={t.y} r={t.r} fill="#10b981" opacity="0.4" stroke="#10b981" strokeWidth="1" />
            <circle cx={t.x - 1} cy={t.y - 1} r={t.r * 0.6} fill="#34d399" opacity="0.7" />
          </g>
        ))}

        {/* --- Roads Layer: 1-Lane, 2-Lane, 4-Lane Widths & Markings --- */}
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
              {/* Sidewalk Curb / Border */}
              <path
                d={pathD}
                fill="none"
                stroke="#475569"
                strokeWidth={width + 5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Road Asphalt Bed */}
              <path
                d={pathD}
                fill="none"
                stroke={isClosed ? '#334155' : (road.condition === 'Bad' ? '#1a2234' : 'url(#roadAsphalt)')}
                strokeWidth={width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Center Dashed Lane Markings */}
              {!isClosed && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={road.lanes >= 4 ? '#fbbf24' : '#00f0ff'}
                  strokeWidth="1.8"
                  strokeDasharray="7 5"
                  opacity="0.85"
                />
              )}

              {/* One-Way Embedded Directional Arrow: ━━━━━━━━━━━━━━→━━━━━━━━━━━━━━ */}
              {road.isOneWay && !isClosed && (
                <g transform={`translate(${midPos.x}, ${midPos.y})`}>
                  <circle cx="0" cy="0" r="7" fill="rgba(0, 240, 255, 0.25)" />
                  <text x="0" y="3" fill="#00f0ff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    ➔
                  </text>
                </g>
              )}

              {/* Road Closure Barricade Overlay */}
              {isClosed && (
                <g transform={`translate(${midPos.x}, ${midPos.y})`}>
                  <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="0.04em">
                    CLOSED
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* --- Accident Indicators 💥 --- */}
        {cityData.accidents.map((acc) => {
          const road = cityData.roads.find((r) => r.id === acc.roadId);
          if (!road) return null;
          const u = cityData.nodeMap[road.source];
          const v = cityData.nodeMap[road.target];
          const pos = getPointOnRoad(u, v, road.curve, 0.35);

          return (
            <g
              key={acc.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElement({
                  type: 'accident',
                  data: { id: acc.id, roadId: acc.roadId },
                  x: pos.x,
                  y: pos.y,
                });
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx="0" cy="0" r="14" fill="rgba(244, 63, 94, 0.3)" className="animate-ping" />
              <circle cx="0" cy="0" r="10" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                💥
              </text>
            </g>
          );
        })}

        {/* --- Construction Zone Pylons 🚧 --- */}
        {cityData.constructions.map((cz) => {
          const road = cityData.roads.find((r) => r.id === cz.roadId);
          if (!road) return null;
          const u = cityData.nodeMap[road.source];
          const v = cityData.nodeMap[road.target];
          const pos = getPointOnRoad(u, v, road.curve, 0.65);

          return (
            <g
              key={cz.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElement({
                  type: 'construction',
                  data: { id: cz.id, roadId: cz.roadId },
                  x: pos.x,
                  y: pos.y,
                });
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx="0" cy="0" r="10" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="0" y="3.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                🚧
              </text>
            </g>
          );
        })}

        {/* --- Intersections & Traffic Signal Junctions 🚦 --- */}
        {cityData.nodes.map((node) => (
          <g
            key={`node-${node.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement({
                type: 'junction',
                data: node,
                x: node.x,
                y: node.y,
              });
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* Intersection Hub Base */}
            <circle cx={node.x} cy={node.y} r="16" fill="#0b1329" stroke="#00f0ff" strokeWidth="2.5" />
            <circle cx={node.x} cy={node.y} r="5" fill="#38bdf8" />

            {/* Mini Traffic Signal Light on Corner */}
            <rect x={node.x + 10} y={node.y - 20} width="6" height="14" rx="2" fill="#1e293b" stroke="#64748b" strokeWidth="0.8" />
            <circle cx={node.x + 13} cy={node.y - 16} r="1.8" fill="#10b981" />
            <circle cx={node.x + 13} cy={node.y - 10} r="1.8" fill="#f43f5e" />

            {/* Junction ID Label */}
            <text
              x={node.x}
              y={node.y - 24}
              fill="#00f0ff"
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="JetBrains Mono"
            >
              {node.id}
            </text>
          </g>
        ))}

        {/* --- 🟢 START Marker --- */}
        {cityData.startNode && (
          <g transform={`translate(${cityData.startNode.x}, ${cityData.startNode.y})`}>
            <circle cx="0" cy="0" r="28" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" />
            <circle cx="0" cy="0" r="16" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="32" fill="#34d399" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">
              🟢 START
            </text>
          </g>
        )}

        {/* --- 🔴 DESTINATION Marker --- */}
        {cityData.destNode && (
          <g transform={`translate(${cityData.destNode.x}, ${cityData.destNode.y})`}>
            <circle cx="0" cy="0" r="28" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" />
            <circle cx="0" cy="0" r="16" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
            <text x="0" y="32" fill="#fb7185" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">
              🏁 DESTINATION
            </text>
          </g>
        )}

        {/* --- Vehicles on Roads --- */}
        {renderedVehicles.map((veh) => (
          <g
            key={veh.id}
            transform={`translate(${veh.x}, ${veh.y})`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement({
                type: 'vehicle',
                data: veh,
                x: veh.x,
                y: veh.y,
              });
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx="0" cy="0" r="11" fill="#00f0ff" stroke="#ffffff" strokeWidth="2" />
            <text x="0" y="3.5" fill="#030712" fontSize="8" fontWeight="bold" textAnchor="middle">
              {veh.type === 'Bikes' ? '🏍️' : veh.type === 'Lorries' ? '🚚' : veh.type === 'Vans' ? '🚐' : veh.type === 'Scooters' ? '🛵' : '🚗'}
            </text>
          </g>
        ))}
      </svg>

      {/* 2. Minimal Floating Map Controls */}
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
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
          className="btn btn-secondary"
          style={{ padding: 9, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Zoom In"
        >
          <ZoomIn size={17} color="#00f0ff" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="btn btn-secondary"
          style={{ padding: 9, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Zoom Out"
        >
          <ZoomOut size={17} color="#00f0ff" />
        </button>
        <button
          onClick={handleResetView}
          className="btn btn-secondary"
          style={{ padding: 9, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Fit / Reset View"
        >
          <RotateCcw size={17} color="#00f0ff" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="btn btn-secondary"
          style={{ padding: 9, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={17} color="#00f0ff" /> : <Maximize size={17} color="#00f0ff" />}
        </button>
      </div>

      {/* 3. Floating Minimal Reconfigure Pill */}
      <div
        className="map-control-btn"
        style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(5, 11, 20, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '8px 18px',
          borderRadius: 30,
          border: '1px solid #00f0ff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 20px rgba(0, 240, 255, 0.3)',
          zIndex: 20,
        }}
      >
        <button
          onClick={onReconfigure}
          className="btn btn-secondary"
          style={{ padding: '8px 18px', borderRadius: 20, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Sliders size={14} /> ⚙️ RECONFIGURE SCENARIO
        </button>
      </div>

      {/* 4. Small Contextual Tooltip Popover (Anchored to Element) */}
      {selectedElement && (
        <div
          className="map-popover"
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(5, 11, 20, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #00f0ff',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.9), 0 0 20px rgba(0, 240, 255, 0.25)',
            maxWidth: 280,
            zIndex: 30,
            color: '#f8fafc',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong className="font-orbitron" style={{ color: '#00f0ff', letterSpacing: '0.04em', fontSize: '0.88rem' }}>
              {selectedElement.type === 'road'
                ? `ROAD ${selectedElement.data.source} ➔ ${selectedElement.data.target}`
                : selectedElement.type === 'junction'
                ? `JUNCTION ${selectedElement.data.id}`
                : selectedElement.type === 'accident'
                ? `INCIDENT: ACCIDENT`
                : selectedElement.type === 'construction'
                ? `WORK ZONE: CONSTRUCTION`
                : `VEHICLE ${selectedElement.data.id}`}
            </strong>
            <button
              onClick={() => setSelectedElement(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {selectedElement.type === 'road' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, color: '#cbd5e1' }}>
              <div>Length: <strong>{selectedElement.data.distance_km} km</strong></div>
              <div>Lanes: <strong>{selectedElement.data.lanes} Lanes</strong></div>
              <div>Capacity: <strong>{selectedElement.data.capacity_vehicles} veh</strong></div>
              <div>Condition: <span className="badge badge-cyan">{selectedElement.data.condition}</span></div>
              <div>Type: <span>{selectedElement.data.isOneWay ? 'One-Way' : 'Two-Way'}</span></div>
              <div>Status: <span className={`badge ${selectedElement.data.status === 'OPEN' ? 'badge-emerald' : 'badge-rose'}`}>{selectedElement.data.status}</span></div>
            </div>
          )}

          {selectedElement.type === 'junction' && (
            <div style={{ color: '#cbd5e1' }}>
              <div>Node Name: <strong>{selectedElement.data.name}</strong></div>
              <div style={{ marginTop: 4 }}>Signal Status: <span className="badge badge-emerald">ACTIVE SIGNAL</span></div>
            </div>
          )}

          {selectedElement.type === 'vehicle' && (
            <div style={{ color: '#cbd5e1' }}>
              <div>Vehicle Type: <strong>{selectedElement.data.type}</strong></div>
              <div>Assigned Corridor: <strong>{selectedElement.data.roadId}</strong></div>
              <div style={{ marginTop: 4 }}>Telemetry: <span className="badge badge-cyan">EN ROUTE</span></div>
            </div>
          )}

          {selectedElement.type === 'accident' && (
            <div style={{ color: '#f43f5e' }}>
              <div>Accident on Road: <strong>{selectedElement.data.roadId}</strong></div>
              <div style={{ marginTop: 4, color: '#cbd5e1' }}>Capacity reduced by 50%</div>
            </div>
          )}

          {selectedElement.type === 'construction' && (
            <div style={{ color: '#f59e0b' }}>
              <div>Active Work Zone on Road: <strong>{selectedElement.data.roadId}</strong></div>
              <div style={{ marginTop: 4, color: '#cbd5e1' }}>Speed limit reduced to 25 km/h</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
