/**
 * api.js — REST Client for Route Planner Backend API
 */

const API_BASE = '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return await res.json();
  } catch (err) {
    console.error('Health fetch error:', err);
    return null;
  }
}

export async function fetchProjectInfo() {
  try {
    const res = await fetch(`${API_BASE}/info`);
    if (!res.ok) throw new Error('Failed to fetch project info');
    return await res.json();
  } catch (err) {
    console.error('Project info fetch error:', err);
    return null;
  }
}

export async function fetchScenarios() {
  try {
    const res = await fetch(`${API_BASE}/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return await res.json();
  } catch (err) {
    console.error('Scenarios fetch error:', err);
    return { scenarios: [] };
  }
}

export async function fetchNetwork(preset = 'demo') {
  try {
    const res = await fetch(`${API_BASE}/network?preset=${encodeURIComponent(preset)}`);
    if (!res.ok) throw new Error('Failed to fetch network');
    return await res.json();
  } catch (err) {
    console.error('Network fetch error:', err);
    return null;
  }
}

export async function fetchTraffic(preset = 'demo', seed = 42) {
  try {
    const res = await fetch(`${API_BASE}/traffic?preset=${encodeURIComponent(preset)}&seed=${seed}`);
    if (!res.ok) throw new Error('Failed to fetch traffic');
    return await res.json();
  } catch (err) {
    console.error('Traffic fetch error:', err);
    return null;
  }
}

export async function fetchVehicles(preset = 'demo') {
  try {
    const res = await fetch(`${API_BASE}/vehicles?preset=${encodeURIComponent(preset)}`);
    if (!res.ok) throw new Error('Failed to fetch vehicles');
    return await res.json();
  } catch (err) {
    console.error('Vehicles fetch error:', err);
    return null;
  }
}

export async function optimizeRoutes(payload) {
  const res = await fetch(`${API_BASE}/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Optimization error: ${errorText}`);
  }

  return await res.json();
}
