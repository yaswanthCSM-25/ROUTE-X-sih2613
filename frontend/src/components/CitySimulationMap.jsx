import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  Sliders,
  Play,
  Pause,
  Zap,
  Car,
  AlertTriangle,
  Compass,
  Clock,
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2,
  X,
  Radio,
  Activity,
  Layers,
} from 'lucide-react';

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
  const [selectedElement, setSelectedElement] = useState(null);

  // 1. Compute Base Network Layout and City Elements
  const cityLayout = useMemo(() => {
    if (!network?.nodes || network.nodes.length === 0) {
      return {
        viewBox: '0 0 1000 600',
        nodes: [],
        roads: [],
        buildings: [],
        trees: [],
        nodeMap: {},
        centerX: 500,
        centerY: 300,
      };
    }

    const nMap = {};
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    network.nodes.forEach((n) => {
      nMap[n.id] = n;
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const padding = 130;
    const width = Math.max(900, maxX - minX + padding * 2);
    const height = Math.max(550, maxY - minY + padding * 2);
    const vb = `${minX - padding} ${minY - padding} ${width} ${height}`;

    // Unique roads
    const seen = new Set();
    const uniqueRoads = [];
    (network.roads || []).forEach((r) => {
      const key = [r.source, r.target].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRoads.push(r);
      }
    });

    // Procedural 2D Holographic Buildings & Greenery
    const buildings = [];
    const trees = [];

    uniqueRoads.forEach((r, idx) => {
      const u = nMap[r.source];
      const v = nMap[r.target];
      if (!u || !v) return;

      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      // Place holographic tech buildings
      const offsetDist = 48;
      buildings.push({
        id: `bldg-${idx}-1`,
        x: midX + nx * offsetDist,
        y: midY + ny * offsetDist,
        w: 36 + (idx % 3) * 10,
        h: 28 + (idx % 4) * 8,
        type: idx % 3 === 0 ? 'tower' : 'hub',
        color: idx % 3 === 0 ? 'rgba(0, 240, 255, 0.12)' : 'rgba(2, 132, 199, 0.15)',
        roofColor: idx % 3 === 0 ? '#00f0ff' : '#38bdf8',
      });

      // Place data telemetry nodes / trees
      trees.push({
        id: `tree-${idx}-1`,
        x: midX - nx * 36 + (idx % 20) - 10,
        y: midY - ny * 36 + (idx % 20) - 10,
        r: 8 + (idx % 3) * 2,
      });
    });

    return {
      viewBox: vb,
      nodes: network.nodes,
      roads: uniqueRoads,
      buildings,
      trees,
      nodeMap: nMap,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, [network]);

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

  // Road Width derivation based on capacity
  const getRoadWidth = (road) => {
    const cap = road.capacity_vehicles || 6;
    if (cap <= 4) return 16;
    if (cap <= 8) return 24;
    return 34;
  };

  // Vehicles to render
  const renderedVehicles = useMemo(() => {
    if (!cityLayout.roads.length) return [];
    const count = config?.vehicles?.count || 10;
    const vType = config?.vehicles?.type || 'Mixed';
    const list = [];

    const typePool = vType === 'Mixed' ? ['Cars', 'Bikes', 'Vans', 'Lorries', 'Scooters'] : [vType];

    for (let i = 0; i < count; i++) {
      const road = cityLayout.roads[i % cityLayout.roads.length];
      const u = cityLayout.nodeMap[road.source];
      const v = cityLayout.nodeMap[road.target];
      if (!u || !v) continue;

      const t = 0.2 + (i * 0.18) % 0.65;
      const type = typePool[i % typePool.length];

      list.push({
        id: `V${i + 1}`,
        type,
        x: u.x + (v.x - u.x) * t,
        y: u.y + (v.y - u.y) * t,
        roadId: `${road.source}-${road.target}`,
      });
    }
    return list;
  }, [cityLayout, config]);

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
        height: 'calc(100vh - 120px)',
        minHeight: 640,
        background: 'radial-gradient(circle at 50% 50%, #081630 0%, #030712 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 16px 50px rgba(0,0,0,0.8), 0 0 35px rgba(0, 240, 255, 0.15)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* 1. Full-Screen Interactive Cyber-Holographic SVG Canvas */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        viewBox={cityLayout.viewBox}
      >
        <defs>
          {/* Cyber Neon Glow Filter */}
          <filter id="neonCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonOrangeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hologram Cyber Road Linear Gradient */}
          <linearGradient id="cyberRoadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#081b3a" />
            <stop offset="50%" stopColor="#0a2550" />
            <stop offset="100%" stopColor="#051329" />
          </linearGradient>

          {/* Grid Pattern */}
          <pattern id="hudGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 240, 255, 0.05)" strokeWidth="1" />
            <circle cx="40" cy="40" r="1.5" fill="rgba(0, 240, 255, 0.15)" />
          </pattern>
        </defs>

        {/* Global Holographic Background Grid */}
        <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#hudGrid)" />

        {/* --- Concentric Holographic HUD Telemetry Circles (India Satellite Theme) --- */}
        <g transform={`translate(${cityLayout.centerX}, ${cityLayout.centerY})`}>
          {/* Outer Rotating Orange Arc Ring */}
          <circle
            cx="0"
            cy="0"
            r="380"
            fill="none"
            stroke="rgba(255, 107, 0, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="40 160 80 120"
            className="animate-radar"
          />
          {/* Main Cyan Telemetry Ring with Tick Marks */}
          <circle
            cx="0"
            cy="0"
            r="320"
            fill="none"
            stroke="rgba(0, 240, 255, 0.4)"
            strokeWidth="2"
            strokeDasharray="12 8 4 8"
          />
          {/* Glowing Inner Radar Sweep Ring */}
          <circle
            cx="0"
            cy="0"
            r="240"
            fill="none"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="180 60 120 40"
            className="animate-radar"
            style={{ animationDuration: '22s', animationDirection: 'reverse' }}
          />
          {/* Core Compass Radar Disc */}
          <circle
            cx="0"
            cy="0"
            r="160"
            fill="rgba(0, 240, 255, 0.02)"
            stroke="rgba(0, 240, 255, 0.15)"
            strokeWidth="1"
          />
        </g>

        {/* --- Holographic Tech Buildings --- */}
        {cityLayout.buildings.map((b) => (
          <g key={b.id}>
            <rect
              x={b.x - b.w / 2 + 4}
              y={b.y - b.h / 2 + 4}
              width={b.w}
              height={b.h}
              rx="4"
              fill="rgba(0, 0, 0, 0.5)"
            />
            <rect
              x={b.x - b.w / 2}
              y={b.y - b.h / 2}
              width={b.w}
              height={b.h}
              rx="4"
              fill={b.color}
              stroke="rgba(0, 240, 255, 0.3)"
              strokeWidth="1.5"
            />
            <line
              x1={b.x - b.w / 2 + 4}
              y1={b.y}
              x2={b.x + b.w / 2 - 4}
              y2={b.y}
              stroke="rgba(0, 240, 255, 0.4)"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* --- Holographic Tree Clusters / Data Nodes --- */}
        {cityLayout.trees.map((t) => (
          <g key={t.id}>
            <circle cx={t.x} cy={t.y} r={t.r} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1" />
            <circle cx={t.x} cy={t.y} r="2" fill="#00f0ff" />
          </g>
        ))}

        {/* --- Cyber Road Corridors Layer --- */}
        {cityLayout.roads.map((road) => {
          const u = cityLayout.nodeMap[road.source];
          const v = cityLayout.nodeMap[road.target];
          if (!u || !v) return null;

          const width = getRoadWidth(road);
          const isClosed = road.status === 'CLOSED';
          const roadKey = `${road.source}-${road.target}`;

          return (
            <g
              key={roadKey}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElement({
                  type: 'road',
                  data: road,
                  x: (u.x + v.x) / 2,
                  y: (u.y + v.y) / 2,
                });
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer Neon Cyber Road Border Glow */}
              <line
                x1={u.x}
                y1={u.y}
                x2={v.x}
                y2={v.y}
                stroke={isClosed ? 'rgba(244, 63, 94, 0.4)' : 'rgba(0, 240, 255, 0.35)'}
                strokeWidth={width + 6}
                strokeLinecap="round"
              />

              {/* Asphalt Road Bed */}
              <line
                x1={u.x}
                y1={u.y}
                x2={v.x}
                y2={v.y}
                stroke="url(#cyberRoadGrad)"
                strokeWidth={width}
                strokeLinecap="round"
              />

              {/* Glowing Center Line Divider */}
              {!isClosed && (
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke="#00f0ff"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  opacity="0.85"
                  filter="url(#neonCyanGlow)"
                />
              )}

              {/* Directional One-Way Laser Arrow */}
              {config?.roadNetwork?.oneWay === 'ON' && !isClosed && (
                <g transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2})`}>
                  <circle cx="0" cy="0" r="8" fill="rgba(0, 240, 255, 0.3)" />
                  <text x="0" y="3" fill="#00f0ff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    ➔
                  </text>
                </g>
              )}

              {/* Road Closure Hazard Barricades */}
              {isClosed && (
                <g transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2})`}>
                  <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" filter="url(#neonOrangeGlow)" />
                  <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">
                    CLOSED
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* --- Active Quantum QPSO Routes Holographic Overlay --- */}
        {benchmark?.routes?.qpso && (
          <g>
            {benchmark.routes.qpso.map((vRoute, idx) => {
              if (!vRoute.path || vRoute.path.length < 2) return null;
              const pathD = vRoute.path
                .map((nId, i) => {
                  const node = cityLayout.nodeMap[nId];
                  return node ? `${i === 0 ? 'M' : 'L'} ${node.x} ${node.y}` : '';
                })
                .join(' ');

              return (
                <path
                  key={`qpso-path-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.9"
                  filter="url(#neonCyanGlow)"
                />
              );
            })}
          </g>
        )}

        {/* --- Intersections & Traffic Junctions --- */}
        {cityLayout.nodes.map((node) => (
          <g
            key={`node-${node.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedElement({
                type: 'node',
                data: node,
                x: node.x,
                y: node.y,
              });
            }}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={node.x} cy={node.y} r="16" fill="#050b14" stroke="#00f0ff" strokeWidth="2.5" filter="url(#neonCyanGlow)" />
            <circle cx={node.x} cy={node.y} r="5" fill="#38bdf8" />
            <text
              x={node.x}
              y={node.y - 20}
              fill="#00f0ff"
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="JetBrains Mono"
              filter="url(#neonCyanGlow)"
            >
              {node.id}
            </text>
          </g>
        ))}

        {/* --- 🟢 START and 🔴 DESTINATION Holographic Beacons --- */}
        {cityLayout.nodes.length >= 2 && (
          <>
            {/* 🟢 START Beacon */}
            <g transform={`translate(${cityLayout.nodes[0].x}, ${cityLayout.nodes[0].y})`}>
              <circle cx="0" cy="0" r="30" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" />
              <circle cx="0" cy="0" r="18" fill="#10b981" stroke="#ffffff" strokeWidth="3" filter="url(#neonCyanGlow)" />
              <text x="0" y="34" fill="#34d399" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">
                🟢 START
              </text>
            </g>

            {/* 🔴 DESTINATION Beacon */}
            <g transform={`translate(${cityLayout.nodes[cityLayout.nodes.length - 1].x}, ${cityLayout.nodes[cityLayout.nodes.length - 1].y})`}>
              <circle cx="0" cy="0" r="30" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" />
              <circle cx="0" cy="0" r="18" fill="#f43f5e" stroke="#ffffff" strokeWidth="3" filter="url(#neonOrangeGlow)" />
              <text x="0" y="34" fill="#ff6b00" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="Orbitron">
                🏁 DESTINATION
              </text>
            </g>
          </>
        )}

        {/* --- Dynamic Vehicles on Holographic Grid --- */}
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
            <circle cx="0" cy="0" r="12" fill="#00f0ff" stroke="#ffffff" strokeWidth="2" filter="url(#neonCyanGlow)" />
            <text x="0" y="4" fill="#030712" fontSize="9" fontWeight="900" textAnchor="middle">
              {veh.type === 'Bikes' ? '🏍️' : veh.type === 'Lorries' ? '🚚' : veh.type === 'Vans' ? '🚐' : veh.type === 'Scooters' ? '🛵' : '🚗'}
            </text>
          </g>
        ))}
      </svg>

      {/* 2. Floating Minimal Navigation Controls */}
      <div
        className="map-control-btn"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
          className="btn btn-secondary"
          style={{ padding: 10, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Zoom In"
        >
          <ZoomIn size={18} color="#00f0ff" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="btn btn-secondary"
          style={{ padding: 10, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Zoom Out"
        >
          <ZoomOut size={18} color="#00f0ff" />
        </button>
        <button
          onClick={handleResetView}
          className="btn btn-secondary"
          style={{ padding: 10, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Reset View"
        >
          <RotateCcw size={18} color="#00f0ff" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="btn btn-secondary"
          style={{ padding: 10, borderRadius: 8, background: 'rgba(5, 11, 20, 0.9)', border: '1px solid #00f0ff' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={18} color="#00f0ff" /> : <Maximize size={18} color="#00f0ff" />}
        </button>
      </div>

      {/* 3. Floating Bottom Action Toolbar */}
      <div
        className="map-control-btn"
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(5, 11, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '10px 20px',
          borderRadius: 35,
          border: '1px solid #00f0ff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 25px rgba(0, 240, 255, 0.35)',
          zIndex: 20,
        }}
      >
        <button
          onClick={onReconfigure}
          className="btn btn-secondary"
          style={{ padding: '10px 20px', borderRadius: 25, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Sliders size={15} /> ⚙️ RECONFIGURE SCENARIO
        </button>

        <button
          onClick={onRunOptimization}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
            color: '#030712',
            border: 'none',
            borderRadius: 25,
            padding: '10px 24px',
            fontSize: '0.92rem',
            fontWeight: 900,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
            letterSpacing: '0.04em',
          }}
        >
          <Zap size={16} color="#030712" />
          {isLoading ? 'OPTIMIZING SWARM...' : '🚀 RUN QUANTUM OPTIMIZATION'}
        </button>
      </div>

      {/* 4. Lightweight Contextual Tooltip Popover */}
      {selectedElement && (
        <div
          className="map-popover"
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            background: 'rgba(5, 11, 20, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #00f0ff',
            borderRadius: 14,
            padding: '18px 22px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.9), 0 0 25px rgba(0, 240, 255, 0.3)',
            maxWidth: 300,
            zIndex: 30,
            color: '#f8fafc',
            fontSize: '0.86rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong className="font-orbitron" style={{ color: '#00f0ff', letterSpacing: '0.05em' }}>
              {selectedElement.type === 'road' ? `ROAD ${selectedElement.data.source} ➔ ${selectedElement.data.target}` : selectedElement.type === 'node' ? `JUNCTION ${selectedElement.data.id}` : `VEHICLE ${selectedElement.data.id}`}
            </strong>
            <button
              onClick={() => setSelectedElement(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>

          {selectedElement.type === 'road' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#cbd5e1' }}>
              <div>Length: <strong>{selectedElement.data.distance_km} km</strong></div>
              <div>Speed Limit: <strong>{selectedElement.data.free_flow_speed_kmph} km/h</strong></div>
              <div>Capacity: <strong>{selectedElement.data.capacity_vehicles} veh</strong></div>
              <div>Status: <span className={`badge ${selectedElement.data.status === 'OPEN' ? 'badge-cyan' : 'badge-rose'}`}>{selectedElement.data.status}</span></div>
            </div>
          )}

          {selectedElement.type === 'node' && (
            <div style={{ color: '#cbd5e1' }}>
              <div>Intersection Coordinate: <strong>({selectedElement.data.x}, {selectedElement.data.y})</strong></div>
              <div style={{ marginTop: 6 }}>Signal Telemetry: <span className="badge badge-emerald">ACTIVE</span></div>
            </div>
          )}

          {selectedElement.type === 'vehicle' && (
            <div style={{ color: '#cbd5e1' }}>
              <div>Vehicle Type: <strong>{selectedElement.data.type}</strong></div>
              <div>Current Corridor: <strong>Road {selectedElement.data.roadId}</strong></div>
              <div style={{ marginTop: 6 }}>Telemetry: <span className="badge badge-cyan">EN ROUTE</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
