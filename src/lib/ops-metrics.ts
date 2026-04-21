type CounterMap = Record<string, number>;

type MetricsState = {
  startedAt: string;
  counters: CounterMap;
};

const globalMetrics = globalThis as unknown as { __nextgearMetrics?: MetricsState };

function getState() {
  if (!globalMetrics.__nextgearMetrics) {
    globalMetrics.__nextgearMetrics = {
      startedAt: new Date().toISOString(),
      counters: {},
    };
  }

  return globalMetrics.__nextgearMetrics;
}

export function incrementMetric(name: string, by = 1) {
  const state = getState();
  state.counters[name] = (state.counters[name] ?? 0) + by;
}

export function getMetricsSnapshot() {
  const state = getState();
  return {
    startedAt: state.startedAt,
    counters: { ...state.counters },
  };
}
