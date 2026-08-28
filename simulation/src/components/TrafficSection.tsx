

interface TrafficSectionProps {
  level: string;
  pattern: string;
  timeOfDay: string;
  onChange: (field: string, value: any) => void;
}

export default function TrafficSection({ level, pattern, timeOfDay, onChange }: TrafficSectionProps) {
  
  return (
    <div className="card">
      <h2>🚦 Traffic</h2>
      
      <div className="form-group">
        <label htmlFor="traffic-level">Traffic Level</label>
        <div className="select-wrapper">
          <select id="traffic-level" value={level} onChange={(e) => onChange('level', e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="traffic-pattern">Traffic Pattern</label>
        <div className="select-wrapper">
          <select id="traffic-pattern" value={pattern} onChange={(e) => onChange('pattern', e.target.value)}>
            <option value="Random">Random (Default)</option>
            <option value="Equally Distributed">Equally Distributed</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="time-of-day">Time of Day (12-hour format)</label>
        <input 
          id="time-of-day"
          type="time" 
          value={timeOfDay} 
          onChange={(e) => onChange('timeOfDay', e.target.value)}
          // time input in browsers generally respects local OS settings for 12/24 hour display.
          // In React, standard time value format for `<input type="time">` is always 24-hour HH:mm.
          // The visual formatting is handled by the browser depending on locale, usually AM/PM for en-US.
        />
      </div>
    </div>
  );
}
