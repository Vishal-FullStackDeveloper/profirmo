'use client';

// DocumentPreviewModal — reusable preview dialog for an uploaded file.
// Images render inline, PDFs render in an <iframe>, anything else shows a
// download link. Built on the shared Modal.

import { ExternalLink, FileDown, FileText } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { resolveFileUrl, isImageType, isPdfType } from '@/services/fileService';

/** Guess whether a URL points at an image when no MIME type is known. */
function looksLikeImage(url) {
  return /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url || '');
}

/** Guess whether a URL points at a PDF when no MIME type is known. */
function looksLikePdf(url) {
  return /\.pdf(\?|#|$)/i.test(url || '');
}

/**
 * DocumentPreviewModal
 * Props: { open, onClose, url, name, mimeType }
 */
export default function DocumentPreviewModal({
  open,
  onClose,
  url,
  name,
  mimeType,
}) {
  const resolved = resolveFileUrl(url);
  const title = name || 'Document preview';

  const isImage = mimeType
    ? isImageType(mimeType)
    : looksLikeImage(resolved);
  const isPdf = mimeType ? isPdfType(mimeType) : looksLikePdf(resolved);

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {!resolved ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No file to preview.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolved}
                alt={title}
                className="mx-auto max-h-[60vh] w-auto object-contain"
              />
            ) : isPdf ? (
              <iframe
                src={resolved}
                title={title}
                className="h-[60vh] w-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600">
                  <FileText size={24} />
                </span>
                <p className="text-sm text-slate-600">
                  This file type cannot be previewed here.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <a
              href={resolved}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Open in new tab
            </a>
            <a
              href={resolved}
              download
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:underline"
            >
              <FileDown className="h-4 w-4" />
              Download
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}
