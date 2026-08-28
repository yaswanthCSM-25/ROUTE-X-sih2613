interface RoadNetworkSectionProps {
  sizeKm2: number;
  density: string;
  oneWayRoutes: number;
  junctions: string;
  laneDistribution: {
    oneLanePercentage: number;
    twoLanePercentage: number;
    fourLanePercentage: number;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  maxOneWayRoutes: number;
}

export default function RoadNetworkSection({ 
  sizeKm2, density, oneWayRoutes, junctions, laneDistribution, onChange, errors, maxOneWayRoutes
}: RoadNetworkSectionProps) {
  
  const handleLaneChange = (laneField: 'oneLanePercentage' | 'twoLanePercentage' | 'fourLanePercentage', valueStr: string) => {
    let newValue = parseFloat(valueStr);
    if (isNaN(newValue)) newValue = 0;
    
    if (newValue < 0) newValue = 0;
    if (newValue > 100) newValue = 100;

    const remaining = 100 - newValue;
    
    const keys = ['oneLanePercentage', 'twoLanePercentage', 'fourLanePercentage'] as const;
    const otherFields = keys.filter(k => k !== laneField);
    
    const otherVal1 = laneDistribution[otherFields[0]];
    const otherVal2 = laneDistribution[otherFields[1]];
    
    const sumOthers = otherVal1 + otherVal2;
    
    let newOtherVal1 = 0;
    let newOtherVal2 = 0;
    
    if (sumOthers > 0) {
      newOtherVal1 = (otherVal1 / sumOthers) * remaining;
      newOtherVal2 = (otherVal2 / sumOthers) * remaining;
    } else {
      newOtherVal1 = remaining / 2;
      newOtherVal2 = remaining / 2;
    }
    
    newValue = Math.round(newValue * 100) / 100;
    newOtherVal1 = Math.round(newOtherVal1 * 100) / 100;
    newOtherVal2 = Math.round((100 - newValue - newOtherVal1) * 100) / 100;

    onChange('laneDistribution', {
      [laneField]: newValue,
      [otherFields[0]]: newOtherVal1,
      [otherFields[1]]: newOtherVal2
    });
  };

  const laneTotal = (laneDistribution.oneLanePercentage + laneDistribution.twoLanePercentage + laneDistribution.fourLanePercentage).toFixed(2);
  const laneTotalNum = parseFloat(laneTotal);
  
  // Custom check for exactly 100 or very close (floating point)
  const isTotalValid = Math.abs(laneTotalNum - 100) < 0.01;

  return (
    <div className="card">
      <h2>🛣️ Road Network</h2>
      
      <div className="form-group">
        <label htmlFor="network-size">Total Network Size (km²)</label>
        <input 
          id="network-size"
          type="number"
          min="20"
          max="100"
          value={sizeKm2 !== undefined && !isNaN(sizeKm2) ? sizeKm2 : ''}
          onChange={(e) => onChange('sizeKm2', parseFloat(e.target.value))}
          className={errors?.sizeKm2 ? 'error' : ''}
        />
        {errors?.sizeKm2 && <span className="error-text">{errors.sizeKm2}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="one-way">One-Way Routes</label>
        <input 
          id="one-way"
          type="number"
          min="0"
          max={maxOneWayRoutes}
          value={oneWayRoutes !== undefined && !isNaN(oneWayRoutes) ? oneWayRoutes : ''}
          onChange={(e) => onChange('oneWayRoutes', parseInt(e.target.value, 10))}
          className={errors?.oneWayRoutes ? 'error' : ''}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Maximum allowed: {maxOneWayRoutes}
        </span>
        {errors?.oneWayRoutes && <span className="error-text">{errors.oneWayRoutes}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="road-density">Number of Routes / Road Density</label>
        <div className="select-wrapper">
          <select id="road-density" value={density} onChange={(e) => onChange('density', e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="junctions">Total Number of Junctions</label>
        <div className="select-wrapper">
          <select id="junctions" value={junctions} onChange={(e) => onChange('junctions', e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>Lane Distribution</label>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div>
            <label htmlFor="lane-1" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>1 Lane (%)</label>
            <input 
              id="lane-1"
              type="number"
              step="0.01"
              value={laneDistribution.oneLanePercentage}
              onChange={(e) => handleLaneChange('oneLanePercentage', e.target.value)}
              className={!isTotalValid ? 'error' : ''}
            />
          </div>
          <div>
            <label htmlFor="lane-2" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>2 Lanes (%)</label>
            <input 
              id="lane-2"
              type="number"
              step="0.01"
              value={laneDistribution.twoLanePercentage}
              onChange={(e) => handleLaneChange('twoLanePercentage', e.target.value)}
              className={!isTotalValid ? 'error' : ''}
            />
          </div>
          <div>
            <label htmlFor="lane-4" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>4 Lanes (%)</label>
            <input 
              id="lane-4"
              type="number"
              step="0.01"
              value={laneDistribution.fourLanePercentage}
              onChange={(e) => handleLaneChange('fourLanePercentage', e.target.value)}
              className={!isTotalValid ? 'error' : ''}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: isTotalValid ? 'var(--text-secondary)' : 'var(--accent-danger)' }}>
            Total: {laneTotal}%
          </span>
        </div>
        
        {!isTotalValid && (
          <span className="error-text">⚠ Lane distribution must total 100%.</span>
        )}
        {errors?.laneDistribution && <span className="error-text">{errors.laneDistribution}</span>}
      </div>
    </div>
  );
}
