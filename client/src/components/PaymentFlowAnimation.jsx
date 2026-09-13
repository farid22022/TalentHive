import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Bird, Check, LockKeyhole, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useMyVirtualCard } from '../services/virtualCard.js';
import { money } from './VirtualCard.jsx';

const steps = ['Payment authorized', 'Held in escrow', 'Milestone approved', 'Released to freelancer'];

const flowStep = (payment, milestone) => {
  if (!payment) return 0;
  if (payment.escrowStatus === 'released' || milestone?.status === 'paid') return 4;
  if (milestone?.status === 'approved') return 3;
  if (payment.escrowStatus === 'funded' || milestone?.status === 'funded') return 2;
  return ['checkout_created', 'processing'].includes(payment.status) ? 1 : 0;
};

function CardNode({ title, card, active, amount, reduced }) {
  return (
    <motion.div
      animate={active && !reduced ? { scale: [1, 1.025, 1] } : {}}
      transition={{ duration: 1.6, repeat: active ? Infinity : 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-teal-900 to-cyan-700 p-4 text-white shadow-xl"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="relative">
        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-widest">
          <span>{title} · virtual card</span><span>simulated</span>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <WalletCards size={17} />
          <span className="font-mono text-sm">{card?.maskedCardNumber || '•••• •••• •••• ••••'}</span>
        </div>
        <div className="mt-4 flex justify-between">
          <div>
            <p className="text-[10px] uppercase text-cyan-100">Balance</p>
            <p className="text-lg font-bold">{card ? money(card.balance, card.currency) : '—'}</p>
            {card?.heldBalance > 0 && <p className="mt-1 text-[10px] text-cyan-100">Held {money(card.heldBalance, card.currency)}</p>}
          </div>
          {amount && <span className="self-end text-xs text-cyan-100">{money(amount)} flow</span>}
        </div>
      </div>
    </motion.div>
  );
}

export function PaymentFlowAnimation({ payment, milestone }) {
  const { hasRole } = useAuth();
  const { data: card } = useMyVirtualCard({ staleTime: 5000 });
  const reduced = useReducedMotion();
  const current = flowStep(payment, milestone);
  const freelancer = hasRole('freelancer');
  const moving = payment && ['checkout_created', 'processing'].includes(payment.status);

  return (
    <section aria-label="Real-time payment flow" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-600">Live payment flow</p>
          <h3 className="mt-1 text-lg font-bold">{freelancer ? (current >= 2 ? 'Funds secured for your milestone' : 'Waiting for client payment') : 'Your payment, protected in escrow'}</h3>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">{payment ? (current === 4 ? 'Released' : current >= 2 ? 'Escrow funded' : 'Processing') : 'Awaiting payment'}</span>
      </div>

      <div className="mt-5 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <CardNode title="Client" card={freelancer ? undefined : card} active={!!moving || current === 4} amount={payment?.amount} reduced={reduced} />
        <div className="flex min-w-[7rem] flex-col items-center gap-2">
          <div className="relative flex h-8 w-full items-center justify-center text-cyan-600">
            <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
            <motion.div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.9)]"
              animate={moving && !reduced ? { x: ['-3rem', '3rem'], opacity: [0, 1, 1, 0] } : { opacity: 0 }}
              transition={{ duration: 1.4, repeat: moving ? Infinity : 0, ease: 'easeInOut' }}
            />
            {[{ delay: 0, y: [3, -5, 2], size: 15 }, { delay: 0.35, y: [7, -1, 6], size: 12 }, { delay: 0.7, y: [-2, -8, 1], size: 10 }].map((bird) => (
              <motion.div
                key={bird.delay}
                aria-hidden="true"
                className="absolute left-1/2 top-0 z-20 text-emerald-500 drop-shadow-[0_2px_3px_rgba(16,185,129,.35)]"
                animate={moving && !reduced ? { x: ['-3rem', '3rem'], y: bird.y, rotate: [-8, 5, -3], opacity: [0, 1, 1, 0] } : { opacity: 0 }}
                transition={{ duration: 1.8, delay: bird.delay, repeat: moving ? Infinity : 0, ease: 'easeInOut' }}
              >
                <Bird size={bird.size} strokeWidth={2.5} fill="currentColor" />
              </motion.div>
            ))}
            <ArrowRight size={18} className="relative z-20 bg-white" />
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500"><LockKeyhole size={14} className="text-cyan-600" />{current >= 2 ? 'Escrow funded' : 'Escrow'}</div>
        </div>
        <CardNode title="Freelancer" card={freelancer ? card : undefined} active={freelancer && (current === 4 || !!moving)} amount={current === 4 ? payment?.amount : null} reduced={reduced} />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-4">
        {steps.map((label, index) => <li key={label} className="flex items-center gap-2 text-xs"><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${current > index ? 'border-cyan-500 bg-cyan-400 text-slate-950' : current === index + 1 ? 'border-cyan-500 text-cyan-700' : 'border-slate-300 text-slate-400'}`}>{current > index ? <Check size={14} /> : index + 1}</span><span className={current >= index + 1 ? 'text-slate-700' : 'text-slate-400'}>{label}</span></li>)}
      </ol>
      <p className="mt-4 text-xs text-slate-500">{payment ? `Transaction ${payment.transactionReference}` : 'Every transition is confirmed by the payment service.'}</p>
    </section>
  );
}
