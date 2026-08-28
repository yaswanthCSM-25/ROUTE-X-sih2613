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
    { id: 'overview', label: '1. Overview', icon: Compass },
    { id: 'simulation', label: '2. Simulation', icon: Navigation },
    { id: 'math_model', label: '3. Math Model', icon: BookOpen },
    { id: 'optimization', label: '4. Optimization', icon: Sliders },
    { id: 'routes', label: '5. Routes', icon: Navigation },
    { id: 'results', label: '6. Results', icon: Award },
    { id: 'convergence', label: '7. Convergence', icon: TrendingDown },
    { id: 'benchmark', label: '8. Benchmark', icon: BarChart2 },
    { id: 'dynamic_routing', label: '9. Dynamic Routing', icon: AlertTriangle },
    { id: 'architecture', label: '10. Architecture', icon: Layers },
    { id: 'about_sih', label: '11. About SIH', icon: FileText },
  ];

  return (
    <header style={{
      background: 'rgba(8, 12, 22, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Upper Branding & Utility Bar */}
      <div style={{
        maxWidth: 1720,
        margin: '0 auto',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
          }}>
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Route Planner
              </h1>
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                <Sparkles size={11} /> SIH26137
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                Egreen Quanta
              </span>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 1 }}>
              Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems
            </p>
          </div>
        </div>

        {/* Right Section: Scenario Switcher & API Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Scenario Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SCENARIO:</span>
            <div style={{
              display: 'flex',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}>
              {scenarios.map((s) => {
                const active = currentPreset === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => onSelectPreset(s.id)}
                    style={{
                      background: active ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      border: active ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                      color: active ? '#34d399' : '#94a3b8',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backend Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 7,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.74rem',
            color: backendOnline ? '#34d399' : '#f43f5e',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#f43f5e',
              boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            }} />
            <span style={{ fontWeight: 600 }}>{backendOnline ? 'API Connected' : 'API Offline'}</span>
          </div>
        </div>
      </div>

      {/* Lower Technical Multi-Page Tab Bar */}
      <div style={{
        maxWidth: 1720,
        margin: '0 auto',
        padding: '0 28px',
        display: 'flex',
        overflowX: 'auto',
        gap: 4,
      }}>
        {navItems.map((item) => {
          const active = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                color: active ? '#34d399' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={active ? '#34d399' : '#64748b'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
