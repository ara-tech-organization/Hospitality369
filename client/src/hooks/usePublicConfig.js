import { useEffect, useState } from 'react';
import api from '../lib/api';

let cache = null;
let inflight = null;

/** Public site configuration (contact info, referral rules, upload limits) – fetched once */
export function usePublicConfig() {
  const [config, setConfig] = useState(cache);
  useEffect(() => {
    if (cache) return;
    inflight ||= api.get('/public/config').then((r) => (cache = r.data.config)).catch(() => null);
    inflight.then((c) => c && setConfig(c));
  }, []);
  return config;
}
