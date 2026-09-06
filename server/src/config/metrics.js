const state = { requests: 0, errors: 0, totalLatencyMs: 0 };
export function recordRequest(status, durationMs) { state.requests += 1; state.totalLatencyMs += durationMs; if (status >= 500) state.errors += 1; }
export function metricsSnapshot() { return { ...state, averageLatencyMs: state.requests ? Math.round(state.totalLatencyMs / state.requests) : 0, errorRate: state.requests ? Number((state.errors / state.requests).toFixed(4)) : 0 }; }
