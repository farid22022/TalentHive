import multer from 'multer';
import { config } from '../config/index.js';
import { ApiError } from '../utils/ApiError.js';

// Keep files in memory; services hand the buffer to the storage layer (ImgBB / local).
const memory = multer.memoryStorage();

const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);
const DOC_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const maxBytes = config.storage.maxFileMb * 1024 * 1024;

function fileFilter(allowed, label) {
  return (_req, file, cb) => {
    if (allowed.has((file.mimetype || '').toLowerCase())) return cb(null, true);
    cb(new ApiError(400, `Unsupported ${label} type: ${file.mimetype}`, 'UNSUPPORTED_MEDIA_TYPE'));
  };
}

const imageUpload = multer({ storage: memory, limits: { fileSize: maxBytes, files: 1 }, fileFilter: fileFilter(IMAGE_MIME, 'image') });
const docUpload = multer({ storage: memory, limits: { fileSize: maxBytes, files: 1 }, fileFilter: fileFilter(DOC_MIME, 'document') });

/** Single-image upload under field `image`. */
export const uploadImage = imageUpload.single('image');
/** Single-document upload under field `document` (CV, etc.). */
export const uploadDocument = docUpload.single('document');
/** Up to 3 documents under field `documents` (verification evidence). */
export const uploadDocuments = multer({
  storage: memory,
  limits: { fileSize: maxBytes, files: 3 },
  fileFilter: fileFilter(DOC_MIME, 'document'),
}).array('documents', 3);

/** Translate Multer errors into our ApiError envelope. Mount right after an upload middleware. */
export function handleUploadError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, `File too large (max ${config.storage.maxFileMb}MB)`, 'FILE_TOO_LARGE'));
    }
    return next(new ApiError(400, err.message, 'UPLOAD_ERROR'));
  }
  return next(err);
}
