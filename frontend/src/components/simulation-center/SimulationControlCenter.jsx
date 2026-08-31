import React, { useState } from 'react';
import {
  VehiclesSection,
  RoadNetworkSection,
  TrafficSection,
  ConditionsSection,
  EventsSection,
  OptimizationSection,
} from './SimulationSections';
import { Rocket, RotateCcw, ShieldCheck, Sparkles, Clock, Play, Compass } from 'lucide-react';

export const DEFAULT_SIMULATION_CONFIG = {
  vehicles: {
    count: 10,
    type: 'Mixed',
  },
  roadNetwork: {
    size: 'Medium',
    density: 'Medium',
    oneWay: 'OFF',
    junctions: 'Medium',
    roadCapacity: 'Medium',
  },
  traffic: {
    level: 'Medium',
    pattern: 'Random',
    timeOfDay: '08:00 AM',
  },
  conditions: {
    weather: 'Normal',
    roadCondition: 'Average',
  },
  events: {
    accidents: 0,
    roadClosures: 0,
    constructionZones: 0,
  },
  optimization: {
    priority: 'Balanced',
  },
};

export default function SimulationControlCenter({
  onSimulate,
  scenarios = [],
  currentPreset = 'demo',
  onSelectPreset,
  onLaunchDemoMode,
  isLoading = false,
}) {
  const [config, setConfig] = useState(DEFAULT_SIMULATION_CONFIG);
  const [errors, setErrors] = useState({});

  const handleSectionChange = (sectionKey, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value,
      },
    }));

    // Clear field-specific error
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_SIMULATION_CONFIG);
    setErrors({});
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    // Validation
    const newErrors = {};
    if (config.vehicles.count < 1 || config.vehicles.count > 20) {
      newErrors.count = 'Number of vehicles must be between 1 and 20.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (onSimulate) {
      onSimulate(config);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1240, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', border: '1px solid var(--border-active)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-emerald">
                <Sparkles size={13} /> SIH26137 Traffic Laboratory
              </span>
              <span className="badge badge-cyan">
                <Clock size={13} /> ⏱️ Travel Time Hero Metric
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>
              Simulation Setup & Scenario Laboratory
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
              Configure vehicle fleets, network scales, weather physics, traffic disruptions, or load pre-calibrated smart city benchmarks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onLaunchDemoMode && (
              <button
                type="button"
                onClick={onLaunchDemoMode}
                style={{
                  background: 'linear-gradient(135deg, #ff8500 0%, #ff6b00 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: '0 0 20px rgba(255, 107, 0, 0.45)',
                  letterSpacing: '0.03em',
                }}
                title="Launch instant 1-click SIH Demonstration with real QPSO optimization and live fleet"
              >
                <Play size={14} /> 🎬 DEMO MODE
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', padding: '9px 14px' }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Presets Quick Bar */}
      <div className="glass-panel" style={{ padding: '16px 22px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="var(--accent-cyan)" />
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                QUICK SCENARIO PRESETS
              </span>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Select pre-configured urban topologies & congestion profiles:
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(scenarios || []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectPreset && onSelectPreset(s.id)}
                style={{
                  background: currentPreset === s.id ? 'var(--accent-cyan)' : 'var(--bg-surface)',
                  border: currentPreset === s.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  color: currentPreset === s.id ? '#030712' : 'var(--text-primary)',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: currentPreset === s.id ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: currentPreset === s.id ? '0 0 12px rgba(0, 240, 255, 0.4)' : 'none',
                }}
              >
                <span>{s.name}</span>
                {currentPreset === s.id && <span style={{ fontSize: '0.7rem' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6 Clean Configuration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* 1. Vehicles */}
        <VehiclesSection
          count={config.vehicles.count}
          type={config.vehicles.type}
          onChange={(f, v) => handleSectionChange('vehicles', f, v)}
          errors={errors}
        />

        {/* 2. Road Network */}
        <RoadNetworkSection
          size={config.roadNetwork.size}
          density={config.roadNetwork.density}
          oneWay={config.roadNetwork.oneWay}
          junctions={config.roadNetwork.junctions}
          roadCapacity={config.roadNetwork.roadCapacity}
          onChange={(f, v) => handleSectionChange('roadNetwork', f, v)}
        />

        {/* 3. Traffic Conditions */}
        <TrafficSection
          level={config.traffic.level}
          pattern={config.traffic.pattern}
          timeOfDay={config.traffic.timeOfDay}
          onChange={(f, v) => handleSectionChange('traffic', f, v)}
        />

        {/* 4. Environmental Conditions */}
        <ConditionsSection
          weather={config.conditions.weather}
          roadCondition={config.conditions.roadCondition}
          onChange={(f, v) => handleSectionChange('conditions', f, v)}
        />

        {/* 5. Unforeseen Events */}
        <EventsSection
          accidents={config.events.accidents}
          roadClosures={config.events.roadClosures}
          constructionZones={config.events.constructionZones}
          onChange={(f, v) => handleSectionChange('events', f, v)}
        />

        {/* 6. Optimization Objectives */}
        <OptimizationSection
          priority={config.optimization.priority}
          onChange={(f, v) => handleSectionChange('optimization', f, v)}
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="glass-panel" style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={16} color="#34d399" />
          <span>Inputs bound to transportation physics and BPR volume-delay curves.</span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 28px',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
            letterSpacing: '0.03em',
          }}
        >
          <Rocket size={17} />
          <span>SIMULATE & OPEN 2D MAP</span>
        </button>
      </div>
    </form>
  );
}
