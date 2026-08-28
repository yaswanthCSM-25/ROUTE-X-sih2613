import React, { useState } from 'react';
import { X, Play, BarChart2, CheckCircle2, TrendingDown, RefreshCw } from 'lucide-react';
import { runBatchBenchmark } from '../services/api';

export default function BatchBenchmarkModal({ isOpen, onClose, currentPreset, fleetSize }) {
  const [seeds, setSeeds] = useState([42, 123, 456, 789, 1000]);
  const [batchData, setBatchData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunBatch = async () => {
    setIsRunning(true);
    try {
      const res = await runBatchBenchmark({
        preset: currentPreset,
        fleet_size: fleetSize || 5,
        seeds,
        num_particles: 20,
        num_iterations: 30,
      });
      setBatchData(res);
    } catch (err) {
      console.error('Batch benchmark error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 24,
    }}>
      <div className="glass-panel" style={{
        maxWidth: 920,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px 34px',
        position: 'relative',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span className="badge badge-emerald">
            <BarChart2 size={13} /> Scientific Repeatability
          </span>
          <span className="badge badge-cyan">5-Seed Monte Carlo Protocol</span>
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
          Multi-Seed Statistical Benchmark Suite
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 20 }}>
          Evaluates QPSO vs. Dijkstra baseline across 5 independent pseudorandom seeds (42, 123, 456, 789, 1000) to demonstrate true statistical performance and reproducibility.
        </p>

        {/* Action button */}
        <div style={{ marginBottom: 20 }}>
          <button
            className="btn btn-primary"
            onClick={handleRunBatch}
            disabled={isRunning}
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            {isRunning ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Running Multi-Seed Evaluation...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Execute 5-Seed Statistical Suite</span>
              </>
            )}
          </button>
        </div>

        {/* Table of Results */}
        {batchData && (
          <div>
            <div style={{
              overflowX: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              background: 'rgba(8, 12, 22, 0.6)',
              marginBottom: 18,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>RNG Seed</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Baseline Dist</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>QPSO Dist</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Dist Imp (%)</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Time Imp (%)</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Final Fitness</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Runtime (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {batchData.runs?.map((r) => (
                    <tr key={r.seed} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#38bdf8' }}>Seed {r.seed}</td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{r.baseline_dist} km</td>
                      <td style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: 600 }}>{r.qpso_dist} km</td>
                      <td style={{ padding: '10px 14px', color: r.dist_imp_pct >= 0 ? '#34d399' : '#f59e0b' }}>
                        {r.dist_imp_pct > 0 ? `+${r.dist_imp_pct}%` : `${r.dist_imp_pct}%`}
                      </td>
                      <td style={{ padding: '10px 14px', color: r.time_imp_pct >= 0 ? '#34d399' : '#f59e0b' }}>
                        {r.time_imp_pct > 0 ? `+${r.time_imp_pct}%` : `${r.time_imp_pct}%`}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', color: '#34d399' }}>{r.qpso_fitness.toFixed(4)}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{r.runtime_sec.toFixed(3)} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Aggregate Summary Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              padding: '16px 20px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 12,
              fontSize: '0.84rem',
            }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Avg Distance Improvement:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{batchData.summary?.avg_distance_improvement_pct}%</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Avg Time Improvement:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{batchData.summary?.avg_time_improvement_pct}%</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Mean Swarm Fitness:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{batchData.summary?.avg_fitness}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Avg Execution Runtime:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{batchData.summary?.avg_runtime_sec} s</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
