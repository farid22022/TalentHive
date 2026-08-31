import crypto from 'node:crypto';
import path from 'node:path';

/** Stable content hash used for AI-result caching. */
export function sha256(text) {
  return crypto.createHash('sha256').update(text || '', 'utf8').digest('hex');
}

/** Approximate word count (whitespace-delimited). */
export function wordCount(text) {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Best-effort text extraction from an uploaded CV buffer.
 * - .txt → decoded UTF-8.
 * - .pdf/.doc/.docx → naive printable-string scrape (no heavy parser dependency).
 *   Compressed PDFs may yield little; callers should allow pasting text as a fallback.
 * Returns a trimmed string, or '' when nothing usable is recovered.
 */
export function extractText(buffer, filename = '') {
  if (!buffer || !buffer.length) return '';
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.txt') return buffer.toString('utf8').trim();

  // Generic scrape: keep printable ASCII + common whitespace, collapse runs.
  const raw = buffer.toString('latin1');
  const printable = raw
    .replace(/[^\x09\x0a\x0d\x20-\x7e]+/g, ' ') // drop control/binary bytes
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Require some alphabetic signal, otherwise treat as unusable binary.
  const letters = (printable.match(/[a-zA-Z]/g) || []).length;
  return letters >= 30 ? printable : '';
}
