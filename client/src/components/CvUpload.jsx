import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FileText, Upload, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useUploadCv, useRemoveCv } from '../services/profile.js';
import { apiErrorMessage } from '../api/client.js';
import { fileUrl } from '../utils/format.js';
import { Button } from './Button.jsx';

const MAX_MB = 10;
const ACCEPT = '.pdf,.doc,.docx,.txt';

/** CV upload card. `cv` is the profile.cv object ({ url, filename, uploadedAt }). */
export function CvUpload({ cv }) {
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);
  const upload = useUploadCv();
  const remove = useRemoveCv();
  const busy = upload.isPending || remove.isPending;

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`File must be under ${MAX_MB}MB`);
    setProgress(0);
    try {
      await upload.mutateAsync({
        file,
        onProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100)),
      });
      toast.success('CV uploaded');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setProgress(0);
    }
  };

  const onRemove = async () => {
    try {
      await remove.mutateAsync();
      toast.success('CV removed');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Resume / CV</h3>
            {cv?.url ? (
              <a
                href={fileUrl(cv.url)}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
              >
                {cv.filename || 'View document'} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="mt-0.5 text-sm text-slate-500">PDF, DOC, DOCX or TXT — up to {MAX_MB}MB</p>
            )}
          </div>
        </div>
        {cv?.url && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Remove CV"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {upload.isPending && progress > 0 && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {cv?.url ? 'Replace CV' : 'Upload CV'}
        </Button>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
      </div>
    </div>
  );
}
