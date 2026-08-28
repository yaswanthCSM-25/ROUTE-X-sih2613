

interface OptimizationSectionProps {
  priority: string;
  onChange: (field: string, value: any) => void;
}

export default function OptimizationSection({ priority, onChange }: OptimizationSectionProps) {
  
  return (
    <div className="card" style={{ 
      borderColor: 'var(--accent-purple)', 
      boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)' 
    }}>
      <h2>🧠 Optimization</h2>
      
      <div className="form-group">
        <label htmlFor="priority">Priority Objective</label>
        <div className="select-wrapper">
          <select id="priority" value={priority} onChange={(e) => onChange('priority', e.target.value)}>
            <option value="Balanced">Balanced (Default)</option>
            <option value="Travel Time">Travel Time (Primary)</option>
            <option value="Distance">Distance</option>
            <option value="Traffic Congestion">Traffic Congestion</option>
          </select>
        </div>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          <strong>Note:</strong> Travel Time is the central focus of the routing algorithm. Other factors act as supporting weights.
        </p>
      </div>
    </div>
  );
}
