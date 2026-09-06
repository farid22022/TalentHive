import { VirtualCard } from '../models/VirtualCard.js';
import { WalletLedgerEntry } from '../models/WalletLedgerEntry.js';

/** Report discrepancies without mutating balances; reconciliation is intentionally explicit. */
export async function reconcileVirtualCard(cardId) {
  const card = await VirtualCard.findById(cardId);
  if (!card) return { ok: false, reason: 'CARD_NOT_FOUND' };
  const entries = await WalletLedgerEntry.find({ card: card._id });
  const balance = entries.reduce((total, entry) => total + (entry.direction === 'credit' ? entry.amount : -entry.amount), 0);
  return { ok: Math.round(balance * 100) === Math.round(card.balance * 100), cardId: card._id, recordedBalance: card.balance, ledgerBalance: Math.round(balance * 100) / 100, entries: entries.length };
}
