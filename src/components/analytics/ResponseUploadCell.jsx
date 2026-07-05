import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RiCloseLine, RiDownloadLine, RiFileTextLine, RiFilmLine, RiMusic2Line } from 'react-icons/ri';
import {
  downloadResponseFile,
  formatUploadFileSize,
  formatUploadTimestamp,
  isAudioResponseFile,
  isImageResponseFile,
  isPdfResponseFile,
  isVideoResponseFile,
} from '@/features/forms/utils/responseUploadFiles';

const NO_FILE_LABEL = 'No file uploaded.';

function FileTypeIcon({ file, size = 14 }) {
  if (isImageResponseFile(file)) return null;
  if (isPdfResponseFile(file)) return <RiFileTextLine size={size} className="shrink-0 text-[#b45309]" aria-hidden />;
  if (isVideoResponseFile(file)) return <RiFilmLine size={size} className="shrink-0 text-[#2563eb]" aria-hidden />;
  if (isAudioResponseFile(file)) return <RiMusic2Line size={size} className="shrink-0 text-[#7c3aed]" aria-hidden />;
  return <RiFileTextLine size={size} className="shrink-0 text-[#6b6860]" aria-hidden />;
}

function ImagePreviewModal({ file, onClose }) {
  const src = file?.url ?? file?.downloadUrl;
  if (!src) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        role="presentation"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${file.name}`}
          className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-[12px] bg-white shadow-xl"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Close preview"
          >
            <RiCloseLine size={16} />
          </button>
          <img src={src} alt={file.name} className="max-h-[85vh] max-w-[85vw] object-contain" />
          <div className="border-t border-[#ebe7e0] px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[#181816]">{file.name}</p>
              {file.size != null ? (
                <p className="text-[11px] text-[#8a8880]">{formatUploadFileSize(file.size)}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => downloadResponseFile(file)}
              className="inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-[#e5e3dc] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#393939] hover:bg-[#f4f3ef]"
            >
              <RiDownloadLine size={12} aria-hidden />
              Download
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function UploadFileRow({ file, compact = false }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const isImage = isImageResponseFile(file);
  const previewSrc = file.url ?? file.downloadUrl;
  const metaParts = [
    file.type || null,
    file.size != null ? formatUploadFileSize(file.size) : null,
    formatUploadTimestamp(file.uploadedAt),
  ].filter(Boolean);

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadResponseFile(file);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div
        className={`flex w-full max-w-full items-start gap-2 rounded-[8px] border border-[#ebe7e0] bg-[#fafaf9] ${
          compact ? 'p-1.5' : 'p-2'
        }`}
      >
        {isImage && previewSrc ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="shrink-0 overflow-hidden rounded-[6px] border border-[#e5e3dc] bg-white cursor-pointer hover:opacity-90"
            aria-label={`Preview ${file.name}`}
          >
            <img
              src={previewSrc}
              alt=""
              className={compact ? 'size-10 object-cover' : 'size-12 object-cover'}
            />
          </button>
        ) : (
          <span className={`flex shrink-0 items-center justify-center rounded-[6px] bg-white border border-[#e5e3dc] ${compact ? 'size-10' : 'size-12'}`}>
            <FileTypeIcon file={file} size={compact ? 16 : 18} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium text-[#181816] ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
            {file.name}
          </p>
          {metaParts.length > 0 ? (
            <p className="mt-0.5 text-[11px] leading-snug text-[#8a8880]">{metaParts.join(' · ')}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !(file.downloadUrl ?? file.url)}
          className="inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-[#d8d4cb] bg-white px-2 py-1 text-[11px] font-medium text-[#393939] hover:bg-[#f4f3ef] disabled:cursor-not-allowed disabled:opacity-50"
          title={file.downloadUrl ?? file.url ? 'Download file' : 'Download unavailable'}
        >
          <RiDownloadLine size={11} aria-hidden />
          {downloading ? '…' : 'Download'}
        </button>
      </div>
      {previewOpen ? (
        <ImagePreviewModal file={file} onClose={() => setPreviewOpen(false)} />
      ) : null}
    </>
  );
}

/**
 * Renders upload answer cells in the responses table and detail drawer.
 * @param {{ files?: import('@/features/forms/utils/responseUploadFiles').NormalizedResponseFile[], value?: string, compact?: boolean, className?: string }} props
 */
export default function ResponseUploadCell({ files = [], value, compact = false, className = '' }) {
  const list = Array.isArray(files) ? files : [];

  if (list.length === 0) {
    return (
      <span className={`text-[13px] leading-snug text-[#8a8880] ${className}`}>
        {value && value !== '—' ? value : NO_FILE_LABEL}
      </span>
    );
  }

  return (
    <div className={`flex w-full max-w-full flex-col gap-1.5 ${className}`}>
      {list.map((file) => (
        <UploadFileRow key={file.id} file={file} compact={compact} />
      ))}
    </div>
  );
}
