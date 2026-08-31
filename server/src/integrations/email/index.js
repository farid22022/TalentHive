import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

/**
 * EmailProvider abstraction. Dev default = ConsoleProvider (logs email to stdout).
 * Swap to an SMTP/Nodemailer provider in prod by setting SMTP_HOST.
 */
class ConsoleEmailProvider {
  async send({ to, subject, html, text }) {
    logger.info(
      { to, subject, preview: (text || html || '').slice(0, 140) },
      '📧 [MOCK EMAIL] (set SMTP_HOST to send real email)'
    );
    return { id: `mock_${Date.now()}`, mocked: true };
  }
}

// Placeholder for a real provider; wired when SMTP config is present.
class SmtpEmailProvider {
  constructor() {
    // Lazily require nodemailer only in prod to keep dev install light.
    throw new Error('SMTP provider not yet configured — add nodemailer transport in Phase 15.');
  }
}

let provider;
export function getEmailProvider() {
  if (!provider) {
    provider = config.email.smtpHost ? new SmtpEmailProvider() : new ConsoleEmailProvider();
  }
  return provider;
}

// --- Simple template registry (Phase 1 subset; expanded per phase) ---
const templates = {
  welcome: (d) => ({
    subject: 'Welcome to TalentHive',
    text: `Hi ${d.name}, welcome to TalentHive! Verify your email: ${d.verifyUrl}`,
  }),
  verifyEmail: (d) => ({
    subject: 'Verify your email',
    text: `Confirm your email address: ${d.verifyUrl}`,
  }),
  resetPassword: (d) => ({
    subject: 'Reset your password',
    text: `Reset your password (valid 1h): ${d.resetUrl}. If you didn't request this, ignore it.`,
  }),
};

export async function sendTemplatedEmail(template, to, data = {}) {
  const build = templates[template];
  if (!build) throw new Error(`Unknown email template: ${template}`);
  const { subject, text, html } = build(data);
  return getEmailProvider().send({ to, subject, text, html });
}
