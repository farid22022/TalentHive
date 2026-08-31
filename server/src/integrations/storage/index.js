import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = config.storage.uploadDir || path.resolve(__dirname, '../../uploads');

const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);

function randomName(filename = '') {
  const ext = path.extname(filename) || '';
  return `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Upload an image to ImgBB (when IMGBB_API_KEY is set), else store locally.
 * ImgBB accepts a base64-encoded image via multipart form field `image`.
 * @returns {{ url:string, thumbUrl:string, provider:string, id?:string, deleteUrl?:string }}
 */
async function uploadImage(buffer, { filename = 'image' } = {}) {
  if (config.storage.imgbbKey) {
    try {
      const form = new FormData();
      form.append('image', buffer.toString('base64'));
      form.append('name', path.parse(filename).name);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${config.storage.imgbbKey}`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message || `ImgBB responded ${res.status}`);
      }
      const d = json.data;
      return {
        provider: 'imgbb',
        url: d.url,
        thumbUrl: d.thumb?.url || d.url,
        id: d.id,
        deleteUrl: d.delete_url,
      };
    } catch (err) {
      logger.error({ err }, 'ImgBB upload failed — falling back to local storage');
    }
  }
  return uploadLocal(buffer, { filename, kind: 'images' });
}

/** Store a document/file locally (Cloudinary/S3 provider wired in a later phase). */
async function uploadDocument(buffer, { filename = 'file' } = {}) {
  // Documents are private by default; served via an authorized route, not a public URL.
  return uploadLocal(buffer, { filename, kind: 'documents' });
}

async function uploadLocal(buffer, { filename, kind = 'misc' }) {
  const dir = path.join(LOCAL_DIR, kind);
  await ensureDir(dir);
  const name = randomName(filename);
  const abs = path.join(dir, name);
  await fs.writeFile(abs, buffer);
  return {
    provider: 'local',
    url: `/api/files/${kind}/${name}`, // resolved by the file-serving route
    path: abs,
    thumbUrl: `/api/files/${kind}/${name}`,
  };
}

const ALLOWED_KINDS = new Set(['images', 'documents', 'misc']);

/**
 * Resolve a local file path from a (kind, name) pair, guarding against path traversal.
 * Returns the absolute path, or null if the inputs are unsafe.
 */
function resolveLocal(kind, name) {
  if (!ALLOWED_KINDS.has(kind)) return null;
  const safeName = path.basename(name || ''); // strip any directory components
  if (!safeName || safeName !== name) return null;
  const abs = path.join(LOCAL_DIR, kind, safeName);
  const root = path.resolve(LOCAL_DIR, kind);
  if (!path.resolve(abs).startsWith(root)) return null; // traversal guard
  return abs;
}

export const storage = {
  uploadImage,
  uploadDocument,
  resolveLocal,
  isImage: (mime) => IMAGE_MIME.has((mime || '').toLowerCase()),
  localDir: LOCAL_DIR,
};
