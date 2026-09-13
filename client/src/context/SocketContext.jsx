import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/client.js';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user) return;
    const configured = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_SERVER_URL;
    const apiOrigin = import.meta.env.VITE_API_URL?.startsWith('http') ? new URL(import.meta.env.VITE_API_URL).origin : window.location.origin;
    const s = io(configured || apiOrigin, {
      auth: { token: getAccessToken() },
      transports: ['websocket'],
    });
    setSocket(s);
    s.on('wallet:updated', () => queryClient.invalidateQueries({ queryKey: ['virtual-card'] }));
    return () => { s.close(); setSocket(null); };
  }, [user, queryClient]);
  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
