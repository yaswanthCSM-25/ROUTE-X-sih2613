

interface SimulateButtonProps {
  onClick: () => void;
}

export default function SimulateButton({ onClick }: SimulateButtonProps) {
  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      <button 
        className="btn-primary" 
        onClick={onClick}
        type="button"
      >
        🚀 SIMULATE
      </button>
    </div>
  );
}
