import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/client.js';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user) return;
    const s = io(import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || '/', {
      auth: { token: getAccessToken() },
      transports: ['websocket'],
    });
    setSocket(s);
    return () => s.close();
  }, [user]);
  const value = useMemo(() => ({ socket }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
