import React, { useState } from 'react';
import {
  VehiclesSection,
  RoadNetworkSection,
  TrafficSection,
  ConditionsSection,
  EventsSection,
  OptimizationSection,
} from './SimulationSections';
import { Rocket, RotateCcw, ShieldCheck, Sparkles, Clock } from 'lucide-react';

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

export default function SimulationControlCenter({ onSimulate, isLoading = false }) {
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
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
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>
              Simulation Setup & Scenario Configuration
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: 0 }}>
              Configure vehicle composition, road capacity, traffic intensity, weather, disruptions, and optimization priorities.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
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

        {/* 3. Traffic */}
        <TrafficSection
          level={config.traffic.level}
          pattern={config.traffic.pattern}
          timeOfDay={config.traffic.timeOfDay}
          onChange={(f, v) => handleSectionChange('traffic', f, v)}
        />

        {/* 4. Conditions */}
        <ConditionsSection
          weather={config.conditions.weather}
          roadCondition={config.conditions.roadCondition}
          onChange={(f, v) => handleSectionChange('conditions', f, v)}
        />

        {/* 5. Events */}
        <EventsSection
          accidents={config.events.accidents}
          roadClosures={config.events.roadClosures}
          constructionZones={config.events.constructionZones}
          onChange={(f, v) => handleSectionChange('events', f, v)}
          errors={errors}
        />

        {/* 6. Optimization Priority */}
        <OptimizationSection
          priority={config.optimization.priority}
          onChange={(f, v) => handleSectionChange('optimization', f, v)}
        />
      </div>

      {/* Prominent Primary "SIMULATE" Button */}
      <div style={{
        marginTop: 10,
        marginBottom: 30,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 12,
            padding: '18px 48px',
            fontSize: '1.2rem',
            fontWeight: 800,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.55)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
          }}
        >
          <Rocket size={24} />
          {isLoading ? 'GENERATING SIMULATION...' : '🚀 SIMULATE'}
        </button>
      </div>
    </form>
  );
}
