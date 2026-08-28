import React, { useState } from 'react';
import { BarChart2, Play, RefreshCw, Layers, ShieldCheck, Award, TrendingDown } from 'lucide-react';
import { runBatchBenchmark } from '../services/api';

export default function BenchmarkPage({ currentPreset, fleetSize }) {
  const [batchData, setBatchData] = useState(null);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [scalabilityData, setScalabilityData] = useState(null);
  const [isRunningScale, setIsRunningScale] = useState(false);

  const handleRunBatch = async () => {
    setIsRunningBatch(true);
    try {
      const res = await runBatchBenchmark({
        preset: currentPreset,
        fleet_size: fleetSize || 5,
        seeds: [42, 123, 456, 789, 1000],
        num_particles: 15,
        num_iterations: 25,
      });
      setBatchData(res);
    } catch (err) {
      console.error('Batch benchmark error:', err);
    } finally {
      setIsRunningBatch(false);
    }
  };

  const handleRunScalability = async () => {
    setIsRunningScale(true);
    try {
      const res = await fetch('/api/benchmark/scalability?seed=42');
      if (res.ok) {
        const data = await res.json();
        setScalabilityData(data);
      }
    } catch (err) {
      console.error('Scalability benchmark error:', err);
    } finally {
      setIsRunningScale(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1250, margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-emerald"><BarChart2 size={13} /> Scientific Repeatability</span>
          <span className="badge badge-cyan">Multi-Seed & Scalability</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' }}>
          Experimental Verification & Scalability Protocol
        </h1>
        <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
          Zero-fabrication empirical testing across 5 independent pseudorandom seeds and 4 structured urban network scaling stages.
        </p>
      </div>

      {/* Part 1: 5-Seed Monte Carlo Repeatability */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>
              1. Five-Seed Monte Carlo Repeatability Protocol
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Evaluates QPSO vs. Dijkstra baseline across seeds: 42, 123, 456, 789, 1000.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRunBatch}
            disabled={isRunningBatch}
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            {isRunningBatch ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Executing 5 Seeds...</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run 5-Seed Evaluation</span>
              </>
            )}
          </button>
        </div>

        {batchData && (
          <div>
            {/* Table */}
            <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, background: 'rgba(8, 12, 22, 0.6)', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>RNG Seed</th>
                    <th style={{ padding: '10px 14px', color: '#38bdf8' }}>Base Time</th>
                    <th style={{ padding: '10px 14px', color: '#34d399' }}>QPSO Time</th>
                    <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Time Imp (%)</th>
                    <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Dist Imp (%)</th>
                    <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Cong Imp (%)</th>
                    <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>QPSO Fitness</th>
                    <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Runtime</th>
                  </tr>
                </thead>
                <tbody>
                  {batchData.runs?.map((r) => (
                    <tr key={r.seed} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#38bdf8' }}>Seed {r.seed}</td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{r.baseline_time} min</td>
                      <td style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: 600 }}>{r.qpso_time} min</td>
                      <td style={{ padding: '10px 14px', color: r.time_imp_pct >= 0 ? '#34d399' : '#f59e0b' }}>
                        {r.time_imp_pct > 0 ? `+${r.time_imp_pct}%` : `${r.time_imp_pct}%`}
                      </td>
                      <td style={{ padding: '10px 14px', color: r.dist_imp_pct >= 0 ? '#34d399' : '#f59e0b' }}>
                        {r.dist_imp_pct > 0 ? `+${r.dist_imp_pct}%` : `${r.dist_imp_pct}%`}
                      </td>
                      <td style={{ padding: '10px 14px', color: r.congestion_imp_pct >= 0 ? '#34d399' : '#f59e0b' }}>
                        {r.congestion_imp_pct > 0 ? `+${r.congestion_imp_pct}%` : `${r.congestion_imp_pct}%`}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'JetBrains Mono', color: '#34d399' }}>{r.qpso_fitness.toFixed(4)}</td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{r.runtime_sec.toFixed(2)} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Statistical Distribution Box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              padding: '16px 20px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 10,
              fontSize: '0.84rem',
            }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Mean Travel Time Improvement:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{batchData.summary?.avg_time_improvement_pct}%</strong>
                {batchData.statistics?.time_improvement_pct && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Std: ±{batchData.statistics.time_improvement_pct.std}% | [{batchData.statistics.time_improvement_pct.min}%, {batchData.statistics.time_improvement_pct.max}%]
                  </div>
                )}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Mean Distance Improvement:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{batchData.summary?.avg_distance_improvement_pct}%</strong>
                {batchData.statistics?.distance_improvement_pct && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Std: ±{batchData.statistics.distance_improvement_pct.std}% | [{batchData.statistics.distance_improvement_pct.min}%, {batchData.statistics.distance_improvement_pct.max}%]
                  </div>
                )}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Mean Swarm Fitness:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#f8fafc', fontFamily: 'JetBrains Mono' }}>{batchData.summary?.avg_fitness}</strong>
                {batchData.statistics?.qpso_fitness && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Std: ±{batchData.statistics.qpso_fitness.std}
                  </div>
                )}
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Mean Execution Runtime:</span><br />
                <strong style={{ fontSize: '1.1rem', color: '#f8fafc' }}>{batchData.summary?.avg_runtime_sec} s</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Part 2: 4-Stage Urban Network Scalability */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>
              2. Four-Stage Urban Network Scalability Analysis
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Tests computational runtime and route feasibility scaling from 5 to 50 vehicles across 9 to 30 nodes.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handleRunScalability}
            disabled={isRunningScale}
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            {isRunningScale ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Executing 4 Stages...</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>Run Scalability Suite</span>
              </>
            )}
          </button>
        </div>

        {scalabilityData && (
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 10, background: 'rgba(8, 12, 22, 0.6)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Stage</th>
                  <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Topology</th>
                  <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Fleet</th>
                  <th style={{ padding: '10px 14px', color: '#38bdf8' }}>Base Time</th>
                  <th style={{ padding: '10px 14px', color: '#34d399' }}>QPSO Time</th>
                  <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Time Imp (%)</th>
                  <th style={{ padding: '10px 14px', color: '#cbd5e1' }}>Runtime</th>
                  <th style={{ padding: '10px 14px', color: '#34d399', textAlign: 'center' }}>Validity Rate</th>
                </tr>
              </thead>
              <tbody>
                {scalabilityData.stages?.map((st) => (
                  <tr key={st.stage} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#f8fafc' }}>{st.name}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{st.nodes} nodes / {st.roads} roads</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#38bdf8' }}>{st.vehicles} veh</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{st.baseline_time_min} min</td>
                    <td style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: 600 }}>{st.qpso_time_min} min</td>
                    <td style={{ padding: '10px 14px', color: st.time_imp_pct >= 0 ? '#34d399' : '#f59e0b' }}>
                      {st.time_imp_pct > 0 ? `+${st.time_imp_pct}%` : `${st.time_imp_pct}%`}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{st.qpso_runtime_sec.toFixed(2)} s</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                        <ShieldCheck size={12} /> {st.valid_routes_rate_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
