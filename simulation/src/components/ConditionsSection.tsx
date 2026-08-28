import React, { useState, useEffect } from 'react';

interface ConditionsSectionProps {
  weather: string;
  roadCondition: {
    good: number;
    average: number;
    bad: number;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function ConditionsSection({ weather, roadCondition, onChange, errors }: ConditionsSectionProps) {
  const [localGood, setLocalGood] = useState<string>(roadCondition.good.toString());
  const [localBad, setLocalBad] = useState<string>(roadCondition.bad.toString());

  useEffect(() => {
    setLocalGood(roadCondition.good.toString());
  }, [roadCondition.good]);

  useEffect(() => {
    setLocalBad(roadCondition.bad.toString());
  }, [roadCondition.bad]);

  const handleGoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLocalGood(rawValue);
    
    let val = parseFloat(rawValue);
    if (isNaN(val)) val = 0;
    
    let good = val;
    let bad = roadCondition.bad;
    let average = 100 - good - bad;

    // We pass the new object up, parent will validate and give errors back
    onChange('roadCondition', { good, average, bad });
  };

  const handleBadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLocalBad(rawValue);
    
    let val = parseFloat(rawValue);
    if (isNaN(val)) val = 0;
    
    let bad = val;
    let good = roadCondition.good;
    let average = 100 - good - bad;

    // We pass the new object up, parent will validate and give errors back
    onChange('roadCondition', { good, average, bad });
  };

  const isTotalValid = Math.abs(roadCondition.good + roadCondition.average + roadCondition.bad - 100) < 0.01;
  const total = (roadCondition.good + roadCondition.average + roadCondition.bad).toFixed(0);

  return (
    <div className="card">
      <h2>🌦️ Conditions</h2>
      
      <div className="form-group">
        <label htmlFor="weather">Weather</label>
        <div className="select-wrapper">
          <select id="weather" value={weather} onChange={(e) => onChange('weather', e.target.value)}>
            <option value="Normal">Normal</option>
            <option value="Rainy">Rainy</option>
            <option value="Sunny">Sunny</option>
            <option value="Windy">Windy</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>ROAD CONDITION</label>
        
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label htmlFor="rc-good" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>Good Roads (%)</label>
            <input 
              id="rc-good"
              type="number"
              step="0.01"
              value={localGood}
              onChange={handleGoodChange}
              className={errors?.roadConditionGood ? 'error' : ''}
            />
            {errors?.roadConditionGood && <div className="error-text">⚠ {errors.roadConditionGood}</div>}
          </div>
          
          <div>
            <label htmlFor="rc-average" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>Average Roads (%) <span style={{ color: 'var(--text-muted)' }}>← Auto calculated</span></label>
            <input 
              id="rc-average"
              type="number"
              value={roadCondition.average}
              disabled
            />
          </div>

          <div>
            <label htmlFor="rc-bad" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>Bad Roads (%)</label>
            <input 
              id="rc-bad"
              type="number"
              step="0.01"
              value={localBad}
              onChange={handleBadChange}
              className={errors?.roadConditionBad ? 'error' : ''}
            />
            {errors?.roadConditionBad && <div className="error-text">⚠ {errors.roadConditionBad}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: isTotalValid && roadCondition.average >= 0 ? 'var(--text-secondary)' : 'var(--accent-danger)' }}>
            Total: {total}% {isTotalValid && roadCondition.average >= 0 ? '✓' : ''}
          </span>
        </div>
        
        {roadCondition.average < 0 && (
          <span className="error-text">⚠ Average cannot be negative. Please adjust Good or Bad roads.</span>
        )}
      </div>
    </div>
  );
}
