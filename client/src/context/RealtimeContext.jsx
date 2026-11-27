/**
 * Live dashboard connection (Socket.IO).
 *  - One WebSocket per signed-in dashboard session (uses the httpOnly session cookie).
 *  - `useLiveRefresh(scopes, reload)` re-fetches a page when the server reports
 *    changes in those scopes – no manual refreshing needed.
 *  - Shows toasts for new applications / enquiries.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useToast } from './ToastContext';

const RealtimeContext = createContext({ status: 'offline', subscribe: () => () => {} });

export function RealtimeProvider({ children }) {
  const toast = useToast();
  const [status, setStatus] = useState('connecting'); // connecting | live | reconnecting | offline
  const listeners = useRef(new Set());

  useEffect(() => {
    const socket = io({ path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'], reconnectionDelayMax: 8000 });

    socket.on('ready', () => setStatus('live'));
    socket.on('connect_error', () => setStatus('reconnecting'));
    socket.on('disconnect', (reason) => {
      setStatus('reconnecting');
      // server dropped us on purpose (e.g. permissions changed) – reconnect to re-check access
      if (reason === 'io server disconnect') setTimeout(() => socket.connect(), 300);
    });
    socket.io.on('reconnect_failed', () => setStatus('offline'));

    socket.on('dashboard:changed', ({ scopes }) => {
      listeners.current.forEach((l) => {
        if (l.scopes.some((s) => scopes.includes(s))) l.fire();
      });
    });
    socket.on('application:created', ({ name, appliedFor }) => toast.info(`New application: ${name} · ${appliedFor}`));
    socket.on('enquiry:created', ({ name, source, topic }) => toast.info(`New ${source === 'contact' ? 'message' : `${source} enquiry`} from ${name}${topic ? ` · ${topic}` : ''}`));

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.close();
    };
  }, [toast]);

  const value = useMemo(
    () => ({
      status,
      subscribe: (scopes, fire) => {
        const l = { scopes, fire };
        listeners.current.add(l);
        return () => listeners.current.delete(l);
      },
    }),
    [status]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export const useRealtime = () => useContext(RealtimeContext);

/**
 * Re-run `reload` whenever the server reports a change in any of `scopes`.
 * Bursts of events are collapsed into a single refresh.
 */
export function useLiveRefresh(scopes, reload) {
  const { subscribe } = useRealtime();
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  const key = [].concat(scopes).join(',');
  useEffect(() => {
    let t;
    const off = subscribe(key.split(','), () => {
      clearTimeout(t);
      t = setTimeout(() => reloadRef.current?.(), 350);
    });
    return () => {
      clearTimeout(t);
      off();
    };
  }, [key, subscribe]);
}
