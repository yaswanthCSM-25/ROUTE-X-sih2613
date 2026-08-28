import React, { useState, useEffect } from 'react';

interface EventsSectionProps {
  accidents: number;
  roadClosures: number;
  constructionZones: number;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function EventsSection({ 
  accidents, roadClosures, constructionZones, onChange, errors 
}: EventsSectionProps) {
  
  // Local state for tracking real-time input that might be invalid
  const [localAccidents, setLocalAccidents] = useState<string>(accidents.toString());
  const [localClosures, setLocalClosures] = useState<string>(roadClosures.toString());
  const [localConstruction, setLocalConstruction] = useState<string>(constructionZones.toString());

  useEffect(() => {
    setLocalAccidents(accidents.toString());
  }, [accidents]);

  useEffect(() => {
    setLocalClosures(roadClosures.toString());
  }, [roadClosures]);

  useEffect(() => {
    setLocalConstruction(constructionZones.toString());
  }, [constructionZones]);

  const handleBlur = (field: string, localVal: string) => {
    const val = parseInt(localVal, 10);
    if (isNaN(val) || val < 0 || val > 10) {
      // It's invalid, keep it in local state but don't push up to central config,
      // or push it up so central config can validate it.
      onChange(field, val);
    } else {
      onChange(field, val);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, setter: (val: string) => void) => {
    setter(e.target.value);
    
    // Attempt parsing. If it's a valid number between 0 and 10, update the config immediately.
    // Otherwise, we let the external errors object catch it (triggered on SIMULATE) or 
    // we can trigger validation on blur or change.
    const val = parseInt(e.target.value, 10);
    onChange(field, val); 
  };

  return (
    <div className="card">
      <h2>🚨 Events</h2>
      
      <div className="form-group">
        <label htmlFor="accidents">Accidents (0-10)</label>
        <input 
          id="accidents"
          type="number" 
          min="0" 
          max="10" 
          value={localAccidents} 
          onChange={(e) => handleChange(e, 'accidents', setLocalAccidents)}
          onBlur={() => handleBlur('accidents', localAccidents)}
          className={errors?.accidents ? 'error' : ''}
        />
        {errors?.accidents && <span className="error-text">⚠ {errors.accidents}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="road-closures">Road Closures (0-10)</label>
        <input 
          id="road-closures"
          type="number" 
          min="0" 
          max="10" 
          value={localClosures} 
          onChange={(e) => handleChange(e, 'roadClosures', setLocalClosures)}
          onBlur={() => handleBlur('roadClosures', localClosures)}
          className={errors?.roadClosures ? 'error' : ''}
        />
        {errors?.roadClosures && <span className="error-text">⚠ {errors.roadClosures}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="construction-zones">Construction Zones (0-10)</label>
        <input 
          id="construction-zones"
          type="number" 
          min="0" 
          max="10" 
          value={localConstruction} 
          onChange={(e) => handleChange(e, 'constructionZones', setLocalConstruction)}
          onBlur={() => handleBlur('constructionZones', localConstruction)}
          className={errors?.constructionZones ? 'error' : ''}
        />
        {errors?.constructionZones && <span className="error-text">⚠ {errors.constructionZones}</span>}
      </div>
    </div>
  );
}
