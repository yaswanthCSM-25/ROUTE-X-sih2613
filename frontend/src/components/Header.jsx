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
  Play,
  Moon,
  Sun,
} from 'lucide-react';

export default function Header({
  activePage,
  onNavigate,
  backendOnline,
  scenarios,
  currentPreset,
  onSelectPreset,
  onLaunchDemoMode,
  theme = 'dark',
  onToggleTheme,
}) {
  const navItems = [
    { id: 'simulation', label: '1. Simulation Lab', icon: Navigation },
    { id: 'optimization', label: '2. Route Optimization', icon: Zap },
    { id: 'results', label: '3. Results & Analysis', icon: Award },
    { id: 'math_model', label: '4. Math Model', icon: BookOpen },
    { id: 'dynamic_routing', label: '5. Dynamic Incidents', icon: AlertTriangle },
    { id: 'benchmark', label: '6. Multi-Seed Benchmark', icon: BarChart2 },
    { id: 'about_sih', label: '7. SIH & Architecture', icon: FileText },
  ];

  return (
    <header style={{
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-md)',
      transition: 'all 0.3s ease',
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
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Branding with Holographic Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(0, 240, 255, 0.5)',
            border: '1px solid #ffffff',
            position: 'relative',
          }}>
            <Cpu size={20} color="#030712" />
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
              <h1 className="font-orbitron" style={{ fontSize: '1.18rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                ROUTE PLANNER
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                <Sparkles size={11} /> SIH26137
              </span>
              <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>
                Egreen Quanta
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 1, letterSpacing: '0.01em' }}>
              Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems
            </p>
          </div>
        </div>

        {/* Right Section: Scenario Switcher, Demo Mode, Theme Toggle & API Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick 1-Click SIH Demo Mode Button */}
          {onLaunchDemoMode && (
            <button
              onClick={onLaunchDemoMode}
              style={{
                background: 'linear-gradient(135deg, #ff8500 0%, #ff6b00 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 15px rgba(255, 107, 0, 0.4)',
                letterSpacing: '0.03em',
              }}
              title="Launch instant pre-configured SIH Demonstration Scenario"
            >
              <Play size={13} /> 🎬 DEMO MODE
            </button>
          )}

          {/* Scenario Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
              SCENARIO:
            </span>
            <div style={{
              display: 'flex',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}>
              {(scenarios || []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectPreset(s.id)}
                  style={{
                    background: currentPreset === s.id ? 'var(--accent-cyan)' : 'transparent',
                    border: 'none',
                    color: currentPreset === s.id ? '#030712' : 'var(--text-secondary)',
                    padding: '4px 9px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {s.name?.replace(' Demo', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Dark / Light Mode Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="btn btn-secondary"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#0284c7" />}
              <span style={{ fontWeight: 700 }}>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
            </button>
          )}

          {/* Backend Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            background: 'var(--bg-input)',
            border: backendOnline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 20,
            fontSize: '0.72rem',
            fontFamily: 'JetBrains Mono',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: backendOnline ? '#10b981' : '#f43f5e',
              boxShadow: backendOnline ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
            }} />
            <span style={{ color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
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
                borderBottom: isActive ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={14} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
