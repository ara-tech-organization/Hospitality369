import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../lib/api';

/**
 * GET a resource, re-fetching whenever `url` or `params` change.
 * Ignores stale responses (out-of-order) and exposes `reload`.
 */
export function useApi(url, params, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && url));
  const seq = useRef(0);
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!enabled || !url) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      if (id === seq.current) setData(res.data);
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [url, key, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

/** Debounce a changing value */
export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
