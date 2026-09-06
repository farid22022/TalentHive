import { useState } from 'react';
import { CreditCard, ShieldCheck, RotateCcw } from 'lucide-react';

const money = (value, currency = 'BDT') => new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0);

export function VirtualCard({ card }) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped((value) => !value);
  if (!card) return null;
  const holder = card.user?.name || 'Marketplace Developer';
  const expiry = `${String(card.expiryMonth).padStart(2, '0')}/${String(card.expiryYear).slice(-2)}`;
  return (
    <div className="w-full max-w-xl [perspective:1200px]">
      <button type="button" onClick={toggle} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') toggle(); }} aria-label={flipped ? 'Show virtual card front' : 'Show virtual card back'} className="relative block aspect-[1.586] w-full text-left transition-transform duration-700 [transform-style:preserve-3d] focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200" style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-emerald-300/30 bg-gradient-to-br from-emerald-950 via-teal-800 to-cyan-700 p-6 text-white shadow-2xl [backface-visibility:hidden] sm:p-8">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between"><div><div className="text-lg font-bold tracking-wide">TalentHive</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-100">Virtual marketplace card</div></div><span className="rounded-full border border-white/30 px-2 py-1 text-[9px] font-bold tracking-widest">SIMULATED</span></div>
            <div><div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-emerald-100">Card number</div><div className="font-mono text-lg tracking-[0.12em] sm:text-2xl">{card.maskedCardNumber}</div></div>
            <div className="flex items-end justify-between"><div><div className="text-[10px] uppercase text-emerald-100">Cardholder</div><div className="mt-1 text-sm font-semibold uppercase">{holder}</div></div><div className="text-right"><div className="text-[10px] uppercase text-emerald-100">Valid thru</div><div className="mt-1 font-mono text-sm">{expiry}</div></div></div>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 p-6 text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8">
          <div className="-mx-6 mt-2 h-10 bg-slate-700 sm:-mx-8" /><div className="mt-6 rounded bg-white/10 p-3 text-right font-mono text-sm">CVV: ***</div>
          <div className="mt-7 space-y-2 text-xs text-slate-300"><div>Card ID: <span className="font-mono text-white">TH-{String(card.id || card._id).slice(-8).toUpperCase()}</span></div><div>Cardholder: <span className="text-white">{holder}</span></div><p className="pt-3 text-[11px] leading-relaxed">This is a simulated marketplace virtual card and is not a bank card. No real payment credentials are stored.</p></div>
        </div>
      </button>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500"><RotateCcw className="h-3.5 w-3.5" /> Click or press Enter to flip</div>
    </div>
  );
}

export function CardStatus({ status }) { const active = status === 'active'; return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}><ShieldCheck className="h-3.5 w-3.5" />{status}</span>; }
export { money };
