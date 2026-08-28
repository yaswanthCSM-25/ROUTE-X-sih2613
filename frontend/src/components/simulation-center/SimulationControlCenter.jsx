import React, { useState } from 'react';
import {
  VehiclesSection,
  RoadNetworkSection,
  TrafficSection,
  ConditionsSection,
  EventsSection,
  OptimizationSection,
} from './SimulationSections';
import { Play, RotateCcw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SimulationControlCenter({
  onApplyAndOptimize,
  isLoading,
  fleetSize,
  onChangeFleetSize,
}) {
  const [config, setConfig] = useState({
    vehicles: {
      count: fleetSize || 10,
      type: 'Mixed',
    },
    roadNetwork: {
      sizeKm2: 50,
      density: 'Medium',
      oneWayRoutes: 2,
      junctions: 'Medium',
      laneDistribution: {
        oneLanePercentage: 33.33,
        twoLanePercentage: 33.33,
        fourLanePercentage: 33.34,
      },
    },
    traffic: {
      level: 'Medium',
      pattern: 'Random',
      timeOfDay: '08:00',
    },
    conditions: {
      weather: 'Normal',
      roadCondition: {
        good: 60,
        average: 20,
        bad: 20,
      },
    },
    events: {
      accidents: 0,
      roadClosures: 0,
      constructionZones: 0,
    },
    optimization: {
      priority: 'Balanced',
    },
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(null);

  const calculateMaxOneWay = (size) => {
    if (isNaN(size) || size < 0) return 0;
    return Math.floor((size / 100) * 4);
  };

  const maxOneWayRoutes = calculateMaxOneWay(config.roadNetwork.sizeKm2);

  const updateSection = (section, field, value) => {
    setConfig((prev) => {
      const nextConfig = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };

      if (section === 'roadNetwork' && field === 'sizeKm2') {
        const newMax = calculateMaxOneWay(value);
        if (nextConfig.roadNetwork.oneWayRoutes > newMax) {
          nextConfig.roadNetwork.oneWayRoutes = newMax;
        }
      }

      if (section === 'vehicles' && field === 'count') {
        onChangeFleetSize(value);
      }

      return nextConfig;
    });

    setSuccessMsg(null);
  };

  const validateAll = () => {
    const errs = {};
    if (config.vehicles.count < 1 || config.vehicles.count > 20) {
      errs.count = 'Vehicle count must be between 1 and 20';
    }
    if (config.roadNetwork.sizeKm2 < 20 || config.roadNetwork.sizeKm2 > 100) {
      errs.sizeKm2 = 'Network size must be between 20 and 100 km²';
    }
    if (config.conditions.roadCondition.good > 60) {
      errs.roadConditionGood = 'Good roads cannot exceed 60%';
    }
    if (config.conditions.roadCondition.bad > 20) {
      errs.roadConditionBad = 'Bad roads cannot exceed 20%';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleExecute = () => {
    if (!validateAll()) return;

    setSuccessMsg('Simulation configuration applied! Running QPSO fleet optimization...');

    // Call unified optimization trigger
    onApplyAndOptimize(config);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Simulation Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-cyan"><Sparkles size={13} /> Simulation Control Center</span>
              <span className="badge badge-emerald">Route Planner Unified Engine</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
              Traffic Simulation & Network Parameter Control
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 2 }}>
              Configure comprehensive macro-simulation parameters: vehicle fleet density, road topology, weather, and incidents.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={isLoading}
            style={{ padding: '12px 24px', fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Play size={16} />
            <span>{isLoading ? 'Simulating...' : 'Apply & Run Simulation'}</span>
          </button>
        </div>

        {successMsg && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 8,
            fontSize: '0.84rem',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}
      </div>

      {/* Masonry-Style Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        {/* Column 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <VehiclesSection
            {...config.vehicles}
            onChange={(field, val) => updateSection('vehicles', field, val)}
            errors={errors}
          />
          <ConditionsSection
            {...config.conditions}
            onChange={(field, val) => updateSection('conditions', field, val)}
            errors={errors}
          />
        </div>

        {/* Column 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <TrafficSection
            {...config.traffic}
            onChange={(field, val) => updateSection('traffic', field, val)}
          />
          <EventsSection
            {...config.events}
            onChange={(field, val) => updateSection('events', field, val)}
            errors={errors}
          />
        </div>

        {/* Column 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <RoadNetworkSection
            {...config.roadNetwork}
            onChange={(field, val) => updateSection('roadNetwork', field, val)}
            errors={errors}
            maxOneWayRoutes={maxOneWayRoutes}
          />
          <OptimizationSection
            {...config.optimization}
            onChange={(field, val) => updateSection('optimization', field, val)}
          />
        </div>
      </div>
    </div>
  );
}
