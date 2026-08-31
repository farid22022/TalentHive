import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Camera, Loader2 } from 'lucide-react';
import { profilesApi } from '../api/profiles.js';
import { apiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fileUrl, initials } from '../utils/format.js';

const MAX_MB = 10;

/** Avatar with click-to-upload. Persists to user.avatar (ImgBB or local). */
export function AvatarUpload({ size = 96 }) {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Image must be under ${MAX_MB}MB`);

    setUploading(true);
    try {
      const { avatar } = await profilesApi.uploadAvatar(file);
      setUser((u) => ({ ...u, avatar }));
      toast.success('Photo updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {user?.avatar ? (
        <img
          src={fileUrl(user.avatar)}
          alt={user?.name || 'Avatar'}
          className="h-full w-full rounded-full object-cover ring-2 ring-white shadow"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 ring-2 ring-white shadow">
          {initials(user?.name) || '?'}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white shadow hover:bg-brand-700 disabled:opacity-70"
        aria-label="Change profile photo"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
    </div>
  );
}
