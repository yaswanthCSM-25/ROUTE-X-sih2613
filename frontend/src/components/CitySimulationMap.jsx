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
  const [selectedElement, setSelectedElement] = useState(null); // { type: 'road'|'node'|'vehicle'|'event', data, x, y }

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

    const padding = 120;
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

    // Procedural 2D Buildings & Greenery around road corridors
    const buildings = [];
    const trees = [];
    const seed = 42;

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

      // Place buildings on side of road
      const offsetDist = 45;
      buildings.push({
        id: `bldg-${idx}-1`,
        x: midX + nx * offsetDist,
        y: midY + ny * offsetDist,
        w: 38 + (idx % 3) * 10,
        h: 30 + (idx % 4) * 8,
        type: idx % 3 === 0 ? 'tower' : (idx % 3 === 1 ? 'commercial' : 'house'),
        color: idx % 3 === 0 ? '#1e293b' : (idx % 3 === 1 ? '#334155' : '#0f172a'),
        roofColor: idx % 3 === 0 ? '#38bdf8' : (idx % 3 === 1 ? '#0284c7' : '#0ea5e9'),
      });

      // Place trees in greenery pockets
      trees.push({
        id: `tree-${idx}-1`,
        x: midX - nx * 35 + (idx % 20) - 10,
        y: midY - ny * 35 + (idx % 20) - 10,
        r: 10 + (idx % 4) * 2,
      });
      trees.push({
        id: `tree-${idx}-2`,
        x: midX + nx * 75,
        y: midY + ny * 75,
        r: 9 + (idx % 3) * 2,
      });
    });

    return {
      viewBox: vb,
      nodes: network.nodes,
      roads: uniqueRoads,
      buildings,
      trees,
      nodeMap: nMap,
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
    if (cap <= 4) return 14; // 1-lane narrow
    if (cap <= 8) return 22; // 2-lane medium
    return 32; // 4-lane wide
  };

  // Weather Ambience
  const weatherMode = config?.conditions?.weather || 'Normal';
  const timeOfDay = config?.traffic?.timeOfDay || '08:00 AM';

  const isNight = timeOfDay.includes('PM') && (parseInt(timeOfDay) >= 8 || parseInt(timeOfDay) === 12);
  const isDusk = timeOfDay.includes('PM') && (parseInt(timeOfDay) >= 5 && parseInt(timeOfDay) < 8);

  const ambientBg = isNight
    ? 'linear-gradient(135deg, #030712 0%, #0b1329 100%)'
    : isDusk
    ? 'linear-gradient(135deg, #18181b 0%, #1e1b4b 100%)'
    : 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)';

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
        background: ambientBg,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      {/* 1. Full-Screen Interactive City SVG Map */}
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
          {/* Street Asphalt Texture Pattern */}
          <linearGradient id="asphaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Road Highlight Glow for Optimized Corridor */}
          <filter id="corridorGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Vehicle Marker Filter */}
          <filter id="vehicleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* --- Background Parks & Landscaped Zones --- */}
        {cityLayout.nodes.map((n, i) => (
          <circle
            key={`zone-${i}`}
            cx={n.x}
            cy={n.y}
            r={70}
            fill="rgba(16, 185, 129, 0.04)"
            stroke="rgba(16, 185, 129, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* --- 2D Illustrated Buildings with 3D/Isometric Shadows --- */}
        {cityLayout.buildings.map((b) => (
          <g key={b.id}>
            {/* Building Ground Shadow */}
            <rect
              x={b.x - b.w / 2 + 4}
              y={b.y - b.h / 2 + 4}
              width={b.w}
              height={b.h}
              rx="4"
              fill="rgba(0, 0, 0, 0.35)"
            />
            {/* Building Body */}
            <rect
              x={b.x - b.w / 2}
              y={b.y - b.h / 2}
              width={b.w}
              height={b.h}
              rx="4"
              fill={b.color}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
            {/* Building Roof Accent */}
            <rect
              x={b.x - b.w / 2 + 3}
              y={b.y - b.h / 2 + 3}
              width={b.w - 6}
              height={b.h - 6}
              rx="2"
              fill={b.roofColor}
              opacity="0.25"
            />
          </g>
        ))}

        {/* --- Green Trees with Canopy Cast Shadows --- */}
        {cityLayout.trees.map((t) => (
          <g key={t.id}>
            <circle cx={t.x + 2} cy={t.y + 2} r={t.r} fill="rgba(0, 0, 0, 0.25)" />
            <circle cx={t.x} cy={t.y} r={t.r} fill="#10b981" opacity="0.65" />
            <circle cx={t.x - 2} cy={t.y - 2} r={t.r * 0.65} fill="#34d399" opacity="0.85" />
          </g>
        ))}

        {/* --- Roads Layer (Curved / Branching Asphalt Corridors) --- */}
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
              {/* Sidewalk Curb / Road Border */}
              <line
                x1={u.x}
                y1={u.y}
                x2={v.x}
                y2={v.y}
                stroke="#475569"
                strokeWidth={width + 4}
                strokeLinecap="round"
              />

              {/* Asphalt Road Surface */}
              <line
                x1={u.x}
                y1={u.y}
                x2={v.x}
                y2={v.y}
                stroke={isClosed ? '#334155' : 'url(#asphaltGrad)'}
                strokeWidth={width}
                strokeLinecap="round"
              />

              {/* Center Dashed Lane Divider Markings */}
              {!isClosed && (
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={width > 20 ? '#fbbf24' : '#f8fafc'}
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  opacity="0.75"
                />
              )}

              {/* Road Closure Hazard Barricades */}
              {isClosed && (
                <g transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2})`}>
                  <rect x="-18" y="-8" width="36" height="16" rx="3" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="0" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    CLOSED
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* --- Active Optimized Routes Overlay (if available) --- */}
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
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.85"
                  filter="url(#corridorGlow)"
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
            {/* Intersection Hub Base */}
            <circle cx={node.x} cy={node.y} r="14" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
            <circle cx={node.x} cy={node.y} r="5" fill="#38bdf8" />

            {/* Junction ID Label */}
            <text
              x={node.x}
              y={node.y - 18}
              fill="#f8fafc"
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
              filter="url(#vehicleShadow)"
            >
              {node.id}
            </text>
          </g>
        ))}

        {/* --- 🟢 START and 🔴 DESTINATION Markers --- */}
        {cityLayout.nodes.length >= 2 && (
          <>
            {/* 🟢 START Beacon */}
            <g transform={`translate(${cityLayout.nodes[0].x}, ${cityLayout.nodes[0].y})`}>
              <circle cx="0" cy="0" r="24" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" />
              <circle cx="0" cy="0" r="16" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" filter="url(#vehicleShadow)" />
              <text x="0" y="28" fill="#34d399" fontSize="11" fontWeight="800" textAnchor="middle" filter="url(#vehicleShadow)">
                🟢 START
              </text>
            </g>

            {/* 🔴 DESTINATION Beacon */}
            <g transform={`translate(${cityLayout.nodes[cityLayout.nodes.length - 1].x}, ${cityLayout.nodes[cityLayout.nodes.length - 1].y})`}>
              <circle cx="0" cy="0" r="24" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" />
              <circle cx="0" cy="0" r="16" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" filter="url(#vehicleShadow)" />
              <text x="0" y="28" fill="#fb7185" fontSize="11" fontWeight="800" textAnchor="middle" filter="url(#vehicleShadow)">
                🏁 DESTINATION
              </text>
            </g>
          </>
        )}

        {/* --- Vehicles on Map --- */}
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
            filter="url(#vehicleShadow)"
          >
            <circle cx="0" cy="0" r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            <text x="0" y="3.5" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
              {veh.type === 'Bikes' ? '🏍️' : veh.type === 'Lorries' ? '🚚' : veh.type === 'Vans' ? '🚐' : veh.type === 'Scooters' ? '🛵' : '🚗'}
            </text>
          </g>
        ))}
      </svg>

      {/* 2. Floating Minimal Navigation & Action Controls */}
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
          style={{ padding: 8, borderRadius: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="btn btn-secondary"
          style={{ padding: 8, borderRadius: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleResetView}
          className="btn btn-secondary"
          style={{ padding: 8, borderRadius: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="btn btn-secondary"
          style={{ padding: 8, borderRadius: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      {/* 3. Floating Bottom Action Toolbar */}
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
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px',
          borderRadius: 30,
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          zIndex: 20,
        }}
      >
        <button
          onClick={onReconfigure}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', borderRadius: 20, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Sliders size={14} /> ⚙️ Reconfigure Scenario
        </button>

        <button
          onClick={onRunOptimization}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 20,
            padding: '8px 20px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
          }}
        >
          <Zap size={15} />
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
            background: 'rgba(8, 12, 22, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
            maxWidth: 280,
            zIndex: 30,
            color: '#f8fafc',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedElement.type === 'road' ? `Road ${selectedElement.data.source} ➔ ${selectedElement.data.target}` : selectedElement.type === 'node' ? `Junction ${selectedElement.data.id}` : `Vehicle ${selectedElement.data.id}`}
            </strong>
            <button
              onClick={() => setSelectedElement(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>

          {selectedElement.type === 'road' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5e1' }}>
              <div>Length: <strong>{selectedElement.data.distance_km} km</strong></div>
              <div>Speed Limit: <strong>{selectedElement.data.free_flow_speed_kmph} km/h</strong></div>
              <div>Capacity: <strong>{selectedElement.data.capacity_vehicles} veh</strong></div>
              <div>Status: <span className={`badge ${selectedElement.data.status === 'OPEN' ? 'badge-emerald' : 'badge-rose'}`}>{selectedElement.data.status}</span></div>
            </div>
          )}

          {selectedElement.type === 'node' && (
            <div style={{ color: '#cbd5e1' }}>
              <div>Intersection Coordinate: <strong>({selectedElement.data.x}, {selectedElement.data.y})</strong></div>
              <div style={{ marginTop: 4 }}>Signal Status: <span className="badge badge-emerald">ACTIVE</span></div>
            </div>
          )}

          {selectedElement.type === 'vehicle' && (
            <div style={{ color: '#cbd5e1' }}>
              <div>Vehicle Type: <strong>{selectedElement.data.type}</strong></div>
              <div>Current Corridor: <strong>Road {selectedElement.data.roadId}</strong></div>
              <div>Status: <span className="badge badge-cyan">EN ROUTE</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
