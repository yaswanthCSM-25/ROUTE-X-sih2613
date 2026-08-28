import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, AlertTriangle, ShieldCheck, Navigation } from 'lucide-react';

export default function NetworkMap({
  network,
  traffic,
  baselineRoutes = [],
  qpsoRoutes = [],
  selectedVehicleId,
  onSelectVehicle,
  onToggleRoadStatus,
  simProgress = 0,
  isSimulating = false,
  showBaselineOverlay = true,
  showQpsoOverlay = true,
  onToggleBaselineOverlay,
  onToggleQpsoOverlay,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredRoad, setHoveredRoad] = useState(null);

  // Compute bounding box for responsive SVG viewBox
  const { viewBox, nodes, roads, nodeMap } = useMemo(() => {
    if (!network?.nodes || network.nodes.length === 0) {
      return { viewBox: '0 0 800 450', nodes: [], roads: [], nodeMap: {} };
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

    const padding = 70;
    const width = Math.max(760, maxX - minX + padding * 2);
    const height = Math.max(420, maxY - minY + padding * 2);
    const vb = `${minX - padding} ${minY - padding} ${width} ${height}`;

    // Unique roads by sorted pair
    const seen = new Set();
    const uniqueRoads = [];
    (network.roads || []).forEach((r) => {
      const key = [r.source, r.target].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRoads.push(r);
      }
    });

    return {
      viewBox: vb,
      nodes: network.nodes,
      roads: uniqueRoads,
      nodeMap: nMap,
    };
  }, [network]);

  const getCongestionColor = (c) => {
    if (c === undefined || c === null) return '#10b981';
    if (c < 0.35) return '#10b981'; // Green
    if (c < 0.68) return '#f59e0b'; // Amber
    return '#f43f5e'; // Red
  };

  // Helper to build SVG path line coordinates between node A and B
  const getPathCoords = (pathArray) => {
    if (!pathArray || pathArray.length < 2) return '';
    return pathArray
      .map((nodeId, idx) => {
        const node = nodeMap[nodeId];
        if (!node) return '';
        return `${idx === 0 ? 'M' : 'L'} ${node.x} ${node.y}`;
      })
      .join(' ');
  };

  // Calculate animated position along a multi-node path given progress [0, 1]
  const getVehiclePosition = (pathArray, progress) => {
    if (!pathArray || pathArray.length < 2) return null;
    const numSegments = pathArray.length - 1;
    const totalProgress = Math.min(1.0, Math.max(0.0, progress));
    const segmentProgress = totalProgress * numSegments;
    const segIndex = Math.min(numSegments - 1, Math.floor(segmentProgress));
    const subT = segmentProgress - segIndex;

    const uNode = nodeMap[pathArray[segIndex]];
    const vNode = nodeMap[pathArray[segIndex + 1]];
    if (!uNode || !vNode) return null;

    return {
      x: uNode.x + (vNode.x - uNode.x) * subT,
      y: uNode.y + (vNode.y - uNode.y) * subT,
    };
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Top Header of Map */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={18} color="#10b981" /> Transportation Network Graph & Traffic Flow
          </h3>
          <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            BPR congestion heatmaps • Click road to toggle <span style={{ color: '#f43f5e', fontWeight: 600 }}>CLOSED/OPEN</span> status
          </p>
        </div>

        {/* Layer Toggles & Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Baseline Overlay Toggle */}
          <button
            onClick={onToggleBaselineOverlay}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              border: showBaselineOverlay ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: showBaselineOverlay ? '#38bdf8' : '#64748b',
              background: showBaselineOverlay ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
            }}
          >
            {showBaselineOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Dijkstra / A* Baseline</span>
          </button>

          {/* QPSO Overlay Toggle */}
          <button
            onClick={onToggleQpsoOverlay}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              border: showQpsoOverlay ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: showQpsoOverlay ? '#34d399' : '#64748b',
              background: showQpsoOverlay ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            }}
          >
            {showQpsoOverlay ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Quantum QPSO</span>
          </button>

          {/* Congestion Scale Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(8, 12, 22, 0.7)',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.72rem',
          }}>
            <span style={{ color: '#64748b' }}>BPR Load:</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: '#10b981' }}>Low</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ color: '#f59e0b' }}>Med</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e' }} />
            <span style={{ color: '#f43f5e' }}>High</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.95) 0%, rgba(8, 12, 22, 0.98) 100%)',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6)',
      }}>
        <svg
          viewBox={viewBox}
          style={{ width: '100%', height: 'auto', minHeight: 380, display: 'block' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
            {/* Glowing filters */}
            <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Road Network Edges */}
          {roads.map((road) => {
            const u = nodeMap[road.source];
            const v = nodeMap[road.target];
            if (!u || !v) return null;

            const cong = road.congestion ?? 0.2;
            const color = getCongestionColor(cong);
            const isClosed = road.status === 'CLOSED';
            const load = road.load || 0;
            const isHovered = hoveredRoad && (
              (hoveredRoad.source === road.source && hoveredRoad.target === road.target) ||
              (hoveredRoad.source === road.target && hoveredRoad.target === road.source)
            );

            return (
              <g
                key={`${road.source}-${road.target}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onToggleRoadStatus(road.source, road.target)}
                onMouseEnter={() => setHoveredRoad(road)}
                onMouseLeave={() => setHoveredRoad(null)}
              >
                {/* Hit zone */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Outer halo on hover */}
                {isHovered && (
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={isClosed ? '#f43f5e' : color}
                    strokeWidth="8"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Base Road Line */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={isClosed ? '#475569' : color}
                  strokeWidth={isClosed ? 3 : Math.min(8, 4 + load * 0.8)}
                  strokeDasharray={isClosed ? '6,6' : 'none'}
                  strokeOpacity={isClosed ? 0.6 : 0.85}
                  strokeLinecap="round"
                />

                {/* Midpoint Road Badge */}
                <g transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2})`}>
                  <rect
                    x="-24"
                    y="-11"
                    width="48"
                    height="22"
                    rx="6"
                    fill="rgba(8, 12, 22, 0.88)"
                    stroke={isClosed ? '#f43f5e' : (load > 0 ? '#10b981' : 'rgba(255, 255, 255, 0.12)')}
                    strokeWidth="1"
                  />
                  <text
                    y="4"
                    textAnchor="middle"
                    fill={isClosed ? '#f43f5e' : '#cbd5e1'}
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="JetBrains Mono"
                  >
                    {isClosed ? '⛔ CLOSED' : `${road.distance_km}k ${load > 0 ? `[${load}]` : ''}`}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Baseline Route Overlay (Cyan Dashed) */}
          {showBaselineOverlay && baselineRoutes.map((br) => {
            const isSelected = !selectedVehicleId || selectedVehicleId === br.vehicle_id;
            if (!isSelected) return null;
            const pathD = getPathCoords(br.path);
            if (!pathD) return null;

            return (
              <g key={`base-${br.vehicle_id}`} opacity={selectedVehicleId ? 1 : 0.75}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="5"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-cyan)"
                  opacity="0.8"
                />
              </g>
            );
          })}

          {/* QPSO Route Overlay (Emerald Solid Glowing) */}
          {showQpsoOverlay && qpsoRoutes.map((qr) => {
            const isSelected = !selectedVehicleId || selectedVehicleId === qr.vehicle_id;
            if (!isSelected) return null;
            const pathD = getPathCoords(qr.path);
            if (!pathD) return null;

            return (
              <g key={`qpso-${qr.vehicle_id}`} opacity={selectedVehicleId ? 1 : 0.85}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-emerald)"
                  opacity="0.9"
                />
              </g>
            );
          })}

          {/* Animated Simulation Vehicles */}
          {isSimulating && (
            <g>
              {/* Baseline vehicles (Cyan) */}
              {showBaselineOverlay && baselineRoutes.map((br) => {
                if (selectedVehicleId && selectedVehicleId !== br.vehicle_id) return null;
                const pos = getVehiclePosition(br.path, simProgress);
                if (!pos) return null;
                return (
                  <g key={`veh-base-${br.vehicle_id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle r="7" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" filter="url(#glow-cyan)" />
                    <text y="-10" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
                      {br.vehicle_id} (Dijkstra)
                    </text>
                  </g>
                );
              })}

              {/* QPSO vehicles (Emerald) */}
              {showQpsoOverlay && qpsoRoutes.map((qr) => {
                if (selectedVehicleId && selectedVehicleId !== qr.vehicle_id) return null;
                const pos = getVehiclePosition(qr.path, simProgress);
                if (!pos) return null;
                return (
                  <g key={`veh-qpso-${qr.vehicle_id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" filter="url(#glow-emerald)" />
                    <text y="18" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">
                      {qr.vehicle_id} (QPSO)
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Intersections (Nodes) */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer Ring */}
                <circle
                  r={isHovered ? '18' : '14'}
                  fill="rgba(15, 23, 42, 0.95)"
                  stroke={isHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.25)'}
                  strokeWidth={isHovered ? '2.5' : '1.5'}
                  filter="url(#glow-emerald)"
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Inner Core */}
                <circle r="6" fill="#10b981" />

                {/* Node Label */}
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="Outfit"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {(hoveredRoad || hoveredNode) && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            background: 'rgba(8, 12, 22, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: '0.78rem',
            color: '#cbd5e1',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}>
            {hoveredRoad && (
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>
                  Road Segment: {hoveredRoad.source} ↔ {hoveredRoad.target}
                </div>
                <div>Distance: <strong style={{ color: '#38bdf8' }}>{hoveredRoad.distance_km} km</strong> | Speed: {hoveredRoad.speed_kmph || 40} km/h</div>
                <div>Capacity: {hoveredRoad.capacity || 6} vehicles | Load: <strong style={{ color: '#34d399' }}>{hoveredRoad.load || 0} vehicles</strong></div>
                <div>BPR Delay: <strong style={{ color: '#f59e0b' }}>{hoveredRoad.actual_time_min} min</strong> (Free-flow: {hoveredRoad.free_time_min} min)</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 3 }}>
                  ⚡ Click road to toggle OPEN / CLOSED
                </div>
              </div>
            )}
            {hoveredNode && !hoveredRoad && (
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>Intersection Node {hoveredNode.id}</div>
                <div>Coordinates: ({hoveredNode.x}, {hoveredNode.y})</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
