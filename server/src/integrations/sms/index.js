import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

/**
 * SmsProvider abstraction. Dev default = ConsoleProvider (logs the message to stdout).
 * Swap to Twilio/SNS/etc. in prod by wiring a real provider when SMS_PROVIDER is set.
 * Kept replaceable per the platform mandate (no vendor lock-in).
 */
class ConsoleSmsProvider {
  async send({ to, text }) {
    logger.info(
      { to, preview: (text || '').slice(0, 140) },
      '📱 [MOCK SMS] (set SMS_PROVIDER + credentials to send real SMS)'
    );
    return { id: `mock_${Date.now()}`, mocked: true };
  }
}

// Placeholder for a real provider; wired in a later hardening phase.
class RealSmsProvider {
  constructor() {
    throw new Error('Real SMS provider not yet configured — add a transport in Phase 15.');
  }
}

let provider;
export function getSmsProvider() {
  if (!provider) {
    const kind = (process.env.SMS_PROVIDER || (config.isProd ? '' : 'console')).toLowerCase();
    provider = kind && kind !== 'console' ? new RealSmsProvider() : new ConsoleSmsProvider();
  }
  return provider;
}

/** Test-only hook to reset the memoized provider between runs. */
export function _resetSmsProvider() {
  provider = undefined;
}

export async function sendSms(to, text) {
  return getSmsProvider().send({ to, text });
}
