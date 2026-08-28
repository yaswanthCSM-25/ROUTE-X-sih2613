import React from 'react';

interface VehiclesSectionProps {
  count: number;
  type: string;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export default function VehiclesSection({ count, type, onChange, errors }: VehiclesSectionProps) {
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('count', parseInt(e.target.value, 10));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange('type', e.target.value);
  };

  return (
    <div className="card">
      <h2>🚗 Vehicles</h2>
      
      <div className="form-group">
        <label htmlFor="vehicle-count">Number of Vehicles</label>
        <input 
          id="vehicle-count"
          type="number" 
          min="1" 
          max="20" 
          value={count || ''} 
          onChange={handleCountChange}
          className={errors?.count ? 'error' : ''}
        />
        {errors?.count && <span className="error-text">{errors.count}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="vehicle-type">Vehicle Type</label>
        <div className="select-wrapper">
          <select id="vehicle-type" value={type} onChange={handleTypeChange}>
            <option value="Mixed">Mixed</option>
            <option value="Cars">Cars</option>
            <option value="Bikes">Bikes</option>
            <option value="Lorries">Lorries</option>
            <option value="Scooters">Scooters</option>
            <option value="Vans">Vans</option>
          </select>
        </div>
      </div>
    </div>
  );
}
