'use client';

// PhotoUpload — avatar / cover-photo uploader. Shows the current image
// (resolved to an absolute URL) or a placeholder, and lets the user upload
// an image-only file. Calls onChange(url) with the new relative url, or ''.

import { useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  uploadFile,
  deleteFile,
  validateFile,
  resolveFileUrl,
} from '@/services/fileService';

/**
 * PhotoUpload
 * Props:
 *  - value: stored image URL (relative or absolute) — '' when empty
 *  - onChange: (url) => void — new relative url, or '' on remove
 *  - category: backend file category (must be a photo category)
 *  - shape: 'circle' (avatar) | 'banner' (cover photo)
 */
export default function PhotoUpload({
  value,
  onChange,
  category,
  shape = 'circle',
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileId, setFileId] = useState(null);

  const isBanner = shape === 'banner';
  const resolved = resolveFileUrl(value);
  const hasImage = Boolean(resolved);

  function openPicker() {
    setError('');
    if (inputRef.current) inputRef.current.click();
  }

  async function handleFiles(fileList) {
    const file = fileList && fileList[0];
    if (!file) return;
    setError('');

    const validationError = validateFile(file, { imageOnly: true });
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      const data = await uploadFile(file, category);
      setFileId(data.id || null);
      if (typeof onChange === 'function') onChange(data.url || '');
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleInputChange(e) {
    handleFiles(e.target.files);
  }

  async function handleRemove() {
    const idToDelete = fileId;
    setError('');
    setFileId(null);
    if (typeof onChange === 'function') onChange('');
    if (idToDelete) {
      try {
        await deleteFile(idToDelete);
      } catch {
        /* ignore — best effort */
      }
    }
  }

  const frameClasses = isBanner
    ? 'h-32 w-full rounded-xl sm:h-40'
    : 'h-24 w-24 rounded-full';

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className={isBanner ? '' : 'flex items-center gap-4'}>
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          aria-label={hasImage ? 'Change photo' : 'Upload photo'}
          className={`group relative block overflow-hidden border border-slate-200 bg-slate-100 transition-colors hover:border-amber-300 disabled:cursor-not-allowed ${frameClasses}`}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolved}
              alt="Uploaded photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
              <ImagePlus size={isBanner ? 28 : 22} />
              {isBanner && (
                <span className="text-xs font-medium">
                  Upload cover photo
                </span>
              )}
            </span>
          )}

          {/* Hover / uploading overlay */}
          <span
            className={`absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white transition-opacity ${
              uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </span>
        </button>

        <div className={isBanner ? 'mt-2' : ''}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {uploading
                ? 'Uploading…'
                : hasImage
                  ? 'Change photo'
                  : 'Upload photo'}
            </button>
            {hasImage && !uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          {error ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">
              JPEG, PNG, WEBP or GIF · up to 10 MB
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
