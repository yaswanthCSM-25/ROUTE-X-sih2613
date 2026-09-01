export default function SimulationHeader() {
  return (
    <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <h1 style={{ 
        fontSize: '4rem', 
        fontWeight: '800',
        letterSpacing: '0.05em',
        background: 'linear-gradient(to right, #0f172a, #3b82f6, #0f172a)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent', 
        borderBottom: 'none',
        margin: 0,
        filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))'
      }}>
        ROUTE-X
      </h1>
      <p style={{ fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Simulation Control Center — SIH26137
      </p>
    </header>
  );
}
