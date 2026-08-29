import React from 'react';
import {
  Cpu,
  Sparkles,
  BookOpen,
  Layers,
  BarChart2,
  Navigation,
  Sliders,
  Award,
  TrendingDown,
  AlertTriangle,
  Compass,
  FileText,
  Radio,
  Zap,
} from 'lucide-react';

export default function Header({
  activePage,
  onNavigate,
  backendOnline,
  scenarios,
  currentPreset,
  onSelectPreset,
}) {
  const navItems = [
    { id: 'simulation', label: '1. Simulation Lab', icon: Navigation },
    { id: 'overview', label: '2. Overview', icon: Compass },
    { id: 'math_model', label: '3. Math Model', icon: BookOpen },
    { id: 'optimization', label: '4. Swarm Studio', icon: Sliders },
    { id: 'routes', label: '5. Routes & Fleet', icon: Navigation },
    { id: 'results', label: '6. Scorecard', icon: Award },
    { id: 'convergence', label: '7. Convergence', icon: TrendingDown },
    { id: 'benchmark', label: '8. Benchmark', icon: BarChart2 },
    { id: 'dynamic_routing', label: '9. Dynamic Rerouting', icon: AlertTriangle },
    { id: 'architecture', label: '10. Architecture', icon: Layers },
    { id: 'about_sih', label: '11. About SIH', icon: FileText },
  ];

  return (
    <header style={{
      background: 'rgba(5, 11, 20, 0.92)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(0, 240, 255, 0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.1)',
    }}>
      {/* Upper Branding & Utility Bar */}
      <div style={{
        maxWidth: 1720,
        margin: '0 auto',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        borderBottom: '1px solid rgba(0, 240, 255, 0.08)',
      }}>
        {/* Branding with Holographic Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
            border: '1px solid #ffffff',
            position: 'relative',
          }}>
            <Cpu size={22} color="#030712" />
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ff6b00',
              boxShadow: '0 0 8px #ff6b00',
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="font-orbitron" style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f0fdf4', letterSpacing: '0.05em' }}>
                ROUTE PLANNER
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                <Sparkles size={11} /> SIH26137
              </span>
              <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                Egreen Quanta
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 1, letterSpacing: '0.02em' }}>
              Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems
            </p>
          </div>
        </div>

        {/* Right Section: Scenario Switcher & API Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Scenario Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 700, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>
              SCENARIO:
            </span>
            <div style={{
              display: 'flex',
              background: 'rgba(8, 18, 38, 0.9)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}>
              {(scenarios || []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectPreset(s.id)}
                  style={{
                    background: currentPreset === s.id ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, rgba(2, 132, 199, 0.4) 100%)' : 'transparent',
                    border: currentPreset === s.id ? '1px solid #00f0ff' : '1px solid transparent',
                    color: currentPreset === s.id ? '#00f0ff' : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: currentPreset === s.id ? '0 0 10px rgba(0, 240, 255, 0.3)' : 'none',
                  }}
                >
                  {s.name?.replace(' Demo', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Backend Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'rgba(8, 18, 38, 0.9)',
            border: backendOnline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 20,
            fontSize: '0.74rem',
            fontFamily: 'JetBrains Mono',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#f43f5e',
              boxShadow: backendOnline ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
            }} />
            <span style={{ color: backendOnline ? '#34d399' : '#f43f5e', fontWeight: 700 }}>
              {backendOnline ? 'QUANTUM ENGINE READY' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Nav Bar with High-Tech Luminous Tabs */}
      <nav style={{
        maxWidth: 1720,
        margin: '0 auto',
        padding: '4px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                background: isActive ? 'linear-gradient(180deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.02) 100%)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #00f0ff' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                color: isActive ? '#00f0ff' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 4px 15px rgba(0, 240, 255, 0.2)' : 'none',
              }}
            >
              <Icon size={14} color={isActive ? '#00f0ff' : '#64748b'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
