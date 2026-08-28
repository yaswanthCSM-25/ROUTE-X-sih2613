import { useState } from 'react';
import type { SimulationConfig } from '../types/simulation';
import SimulationHeader from '../components/SimulationHeader';
import VehiclesSection from '../components/VehiclesSection';
import RoadNetworkSection from '../components/RoadNetworkSection';
import TrafficSection from '../components/TrafficSection';
import ConditionsSection from '../components/ConditionsSection';
import EventsSection from '../components/EventsSection';
import OptimizationSection from '../components/OptimizationSection';
import SimulateButton from '../components/SimulateButton';

export default function SimulationPage() {
  const [config, setConfig] = useState<SimulationConfig>({
    vehicles: {
      count: 10,
      type: 'Mixed'
    },
    roadNetwork: {
      sizeKm2: 50,
      density: 'Medium',
      oneWayRoutes: 2,
      junctions: 'Medium',
      laneDistribution: {
        oneLanePercentage: 33.33,
        twoLanePercentage: 33.33,
        fourLanePercentage: 33.34
      }
    },
    traffic: {
      level: 'Medium',
      pattern: 'Random',
      timeOfDay: '08:00'
    },
    conditions: {
      weather: 'Normal',
      roadCondition: {
        good: 60,
        average: 20,
        bad: 20
      }
    },
    events: {
      accidents: 0,
      roadClosures: 0,
      constructionZones: 0
    },
    optimization: {
      priority: 'Balanced'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic maximum calculation
  const calculateMaxOneWay = (size: number) => {
    if (isNaN(size) || size < 0) return 0;
    return Math.floor((size / 100) * 4);
  };

  const maxOneWayRoutes = calculateMaxOneWay(config.roadNetwork.sizeKm2);

  // Validate on change to show errors immediately as requested
  const validateField = (section: keyof SimulationConfig, field: string, value: any) => {
    const newErrors = { ...errors };

    if (section === 'vehicles' && field === 'count') {
      if (isNaN(value) || value < 1 || value > 20) {
        newErrors.count = "Number of vehicles must be between 1 and 20.";
      } else {
        delete newErrors.count;
      }
    }

    if (section === 'roadNetwork' && field === 'sizeKm2') {
      if (isNaN(value) || value < 20 || value > 100) {
        newErrors.sizeKm2 = "Network size must be between 20 km² and 100 km².";
      } else {
        delete newErrors.sizeKm2;
      }
    }

    if (section === 'roadNetwork' && field === 'oneWayRoutes') {
      // Use the newly calculated max if sizeKm2 is what changed, otherwise current max
      const max = maxOneWayRoutes;
      if (isNaN(value) || value < 0 || value > max) {
        newErrors.oneWayRoutes = `One-way routes must be between 0 and ${max}.`;
      } else {
        delete newErrors.oneWayRoutes;
      }
    }

    if (section === 'events') {
      if (field === 'accidents') {
        if (isNaN(value) || value < 0 || value > 10) {
          newErrors.accidents = "Accidents must be between 0 and 10.";
        } else {
          delete newErrors.accidents;
        }
      }
      if (field === 'roadClosures') {
        if (isNaN(value) || value < 0 || value > 10) {
          newErrors.roadClosures = "Road closures must be between 0 and 10.";
        } else {
          delete newErrors.roadClosures;
        }
      }
      if (field === 'constructionZones') {
        if (isNaN(value) || value < 0 || value > 10) {
          newErrors.constructionZones = "Construction zones must be between 0 and 10.";
        } else {
          delete newErrors.constructionZones;
        }
      }
    }

    if (section === 'conditions' && field === 'roadCondition') {
      if (value.good > 60) newErrors.roadConditionGood = "Good roads cannot exceed 60%.";
      else delete newErrors.roadConditionGood;

      if (value.bad > 20) newErrors.roadConditionBad = "Bad roads cannot exceed 20%.";
      else delete newErrors.roadConditionBad;
    }

    setErrors(newErrors);
  };

  const updateSection = (section: keyof SimulationConfig, field: string, value: any) => {
    setConfig(prev => {
      const nextConfig = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      // Auto-correct one-way routes if size changes
      if (section === 'roadNetwork' && field === 'sizeKm2') {
        const newMax = calculateMaxOneWay(value);
        if (nextConfig.roadNetwork.oneWayRoutes > newMax) {
          nextConfig.roadNetwork.oneWayRoutes = newMax;
          // Clear any existing error for oneWayRoutes since we auto-corrected
          setErrors(curr => {
            const errs = { ...curr };
            delete errs.oneWayRoutes;
            return errs;
          });
        }
      }

      return nextConfig;
    });

    validateField(section, field, value);
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate Vehicles
    if (isNaN(config.vehicles.count) || config.vehicles.count < 1 || config.vehicles.count > 20) {
      newErrors.count = "Number of vehicles must be between 1 and 20.";
    }

    // Validate Road Network
    if (isNaN(config.roadNetwork.sizeKm2) || config.roadNetwork.sizeKm2 < 20 || config.roadNetwork.sizeKm2 > 100) {
      newErrors.sizeKm2 = "Network size must be between 20 km² and 100 km².";
    }
    
    if (isNaN(config.roadNetwork.oneWayRoutes) || config.roadNetwork.oneWayRoutes < 0 || config.roadNetwork.oneWayRoutes > maxOneWayRoutes) {
      newErrors.oneWayRoutes = `One-way routes must be between 0 and ${maxOneWayRoutes}.`;
    }

    // Validate Lane Distribution
    const dist = config.roadNetwork.laneDistribution;
    const total = dist.oneLanePercentage + dist.twoLanePercentage + dist.fourLanePercentage;
    if (Math.abs(total - 100) > 0.01) {
      newErrors.laneDistribution = "Lane distribution must total 100%.";
    }

    // Validate Events
    if (isNaN(config.events.accidents) || config.events.accidents < 0 || config.events.accidents > 10) {
      newErrors.accidents = "Accidents must be between 0 and 10.";
    }
    if (isNaN(config.events.roadClosures) || config.events.roadClosures < 0 || config.events.roadClosures > 10) {
      newErrors.roadClosures = "Road closures must be between 0 and 10.";
    }
    if (isNaN(config.events.constructionZones) || config.events.constructionZones < 0 || config.events.constructionZones > 10) {
      newErrors.constructionZones = "Construction zones must be between 0 and 10.";
    }

    // Validate Road Conditions
    const rc = config.conditions.roadCondition;
    if (rc.good > 60) newErrors.roadConditionGood = "Good roads cannot exceed 60%.";
    if (rc.bad > 20) newErrors.roadConditionBad = "Bad roads cannot exceed 20%.";
    if (rc.good < 0 || rc.bad < 0 || rc.average < 0) newErrors.roadConditionNegative = "Road conditions cannot be negative.";
    if (Math.abs(rc.good + rc.average + rc.bad - 100) > 0.01) newErrors.roadConditionTotal = "Road conditions must total 100%.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSimulate = () => {
    if (validateAll()) {
      console.log("Valid Simulation Configuration:", JSON.stringify(config, null, 2));
      alert("Simulation Configuration Validated! Data is ready for the next phase. Check console for output.");
    } else {
      alert("Please fix the validation errors before simulating.");
    }
  };

  return (
    <div className="app-container">
      <SimulationHeader />
      
      <div className="grid-layout masonry-layout">
        <div className="masonry-col col-small">
          <div className="vehicles-card">
            <VehiclesSection 
              {...config.vehicles} 
              onChange={(field, val) => updateSection('vehicles', field, val)} 
              errors={errors} 
            />
          </div>
          <div className="conditions-card">
            <ConditionsSection 
              {...config.conditions} 
              onChange={(field, val) => updateSection('conditions', field, val)} 
              errors={errors}
            />
          </div>
        </div>
        
        <div className="masonry-col col-small">
          <div className="traffic-card">
            <TrafficSection 
              {...config.traffic} 
              onChange={(field, val) => updateSection('traffic', field, val)} 
            />
          </div>
          <div className="events-card">
            <EventsSection 
              {...config.events} 
              onChange={(field, val) => updateSection('events', field, val)} 
              errors={errors} 
            />
          </div>
        </div>
        
        <div className="masonry-col col-wide">
          <div className="road-network-card">
            <RoadNetworkSection 
              {...config.roadNetwork} 
              onChange={(field, val) => updateSection('roadNetwork', field, val)} 
              errors={errors}
              maxOneWayRoutes={maxOneWayRoutes}
            />
          </div>
          <div className="optimization-card">
            <OptimizationSection 
              {...config.optimization} 
              onChange={(field, val) => updateSection('optimization', field, val)} 
            />
          </div>
        </div>
      </div>

      <SimulateButton onClick={handleSimulate} />
    </div>
  );
}
