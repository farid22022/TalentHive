import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../context/SocketContext.jsx';
import { paymentApi } from '../api/payment.js';
export const pendingPayment = p => ['created', 'checkout_created', 'processing'].includes(p?.status);
export function usePaymentSync() {
  const { socket } = useSocket();
  const qc = useQueryClient();
  useEffect(() => {
    const refresh = () => { qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['hiring'] }); qc.invalidateQueries({ queryKey: ['notifications'] }); };
    const events = ['payment:created', 'payment:processing', 'payment:success', 'payment:failed', 'escrow:released', 'connect'];
    events.forEach(e => socket?.on(e, refresh));
    return () => events.forEach(e => socket?.off(e, refresh));
  }, [socket, qc]);
}
export const usePayment = id => useQuery({ queryKey: ['payments', id], queryFn: () => paymentApi.get(id), enabled: !!id, refetchInterval: q => !q.state.data || pendingPayment(q.state.data.payment) ? 2000 : false });
export const usePayments = () => useQuery({ queryKey: ['payments'], queryFn: paymentApi.list, refetchInterval: 5000 });
