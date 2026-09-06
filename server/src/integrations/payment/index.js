import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

/**
 * PaymentProvider interface. Dev default = MockPaymentProvider (instant success, no charge).
 * Provider-specific implementations remain behind this interface.
 */
class MockPaymentProvider {
  constructor() {
    this.name = 'mock';
  }
  async createPaymentIntent({ amount, currency = 'usd', metadata = {} }) {
    return { id: `pi_mock_${Date.now()}`, status: 'requires_capture', amount, currency, metadata, mocked: true };
  }
  async capture(intentId) {
    return { id: intentId, status: 'succeeded', mocked: true };
  }
  async refund({ intentId, amount }) {
    return { id: `re_mock_${Date.now()}`, intentId, amount, status: 'succeeded', mocked: true };
  }
  async payout({ amount, destination }) {
    return { id: `po_mock_${Date.now()}`, amount, destination, status: 'paid', mocked: true };
  }
  async createCheckoutSession({ intentId, returnUrl, cancelUrl }) { return { id: `cs_mock_${Date.now()}`, intentId, url: returnUrl || cancelUrl || null, mocked: true }; }
  async webhook() {
    return { received: true, mocked: true };
  }
}

class StripeProvider {
  constructor() {
    throw new Error('StripeProvider not yet wired — implemented in Phase 9.');
  }
}

let provider;
export function getPaymentProvider() {
  if (provider) return provider;
  switch (config.payment.provider) {
    case 'stripe':
    case 'paypal':
      provider = new StripeProvider();
      break;
    case 'mock':
    default:
      provider = new MockPaymentProvider();
      if (config.payment.provider !== 'mock') {
        logger.warn(`Unknown PAYMENT_PROVIDER "${config.payment.provider}", falling back to mock.`);
      }
  }
  return provider;
}
