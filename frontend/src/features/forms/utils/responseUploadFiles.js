/** Upload / file-based question labels in the form builder. */
export const UPLOAD_QUESTION_LABELS = new Set([
  'Upload',
  'Multi-image upload',
  'File Upload',
  'Image Upload',
  'Video Upload',
  'Audio Upload',
]);

export function isUploadQuestionLabel(label) {
  if (!label) return false;
  if (UPLOAD_QUESTION_LABELS.has(label)) return true;
  const normalized = String(label).toLowerCase();
  if (!normalized.includes('upload')) return false;
  return (
    normalized.includes('file')
    || normalized.includes('image')
    || normalized.includes('video')
    || normalized.includes('audio')
    || normalized.includes('multi')
  );
}

function extFromName(name) {
  const m = String(name ?? '').match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '';
}

const EXT_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export function guessMimeFromName(name) {
  const ext = extFromName(name);
  return EXT_MIME[ext] ?? '';
}

/** @typedef {{ id: string, name: string, url: string|null, downloadUrl: string|null, size: number|null, type: string, uploadedAt: string|null }} NormalizedResponseFile */

/** @param {unknown} raw @param {number} index @returns {NormalizedResponseFile|null} */
export function normalizeResponseFile(raw, index = 0) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const name = raw.trim() || `File ${index + 1}`;
    return {
      id: `file-${index}`,
      name,
      url: null,
      downloadUrl: null,
      size: null,
      type: guessMimeFromName(name),
      uploadedAt: null,
    };
  }
  if (typeof raw !== 'object') return null;

  const name = raw.name ?? raw.filename ?? raw.fileName ?? `File ${index + 1}`;
  const url =
    raw.url
    ?? raw.downloadUrl
    ?? raw.href
    ?? raw.src
    ?? raw.storageUrl
    ?? raw.publicUrl
    ?? raw.dataUrl
    ?? null;
  const downloadUrl =
    raw.downloadUrl
    ?? raw.url
    ?? raw.href
    ?? raw.storageUrl
    ?? raw.publicUrl
    ?? raw.dataUrl
    ?? null;
  const size = typeof raw.size === 'number' ? raw.size : raw.fileSize ?? null;
  const type = raw.type ?? raw.mimeType ?? raw.contentType ?? guessMimeFromName(name);
  const uploadedAt = raw.uploadedAt ?? raw.createdAt ?? raw.timestamp ?? null;

  return {
    id: String(raw.id ?? `${name}-${index}`),
    name: String(name),
    url,
    downloadUrl,
    size,
    type: String(type || ''),
    uploadedAt: uploadedAt ? String(uploadedAt) : null,
  };
}

/** @param {object|undefined|null} snap */
export function extractUploadFilesFromSnap(snap) {
  const raw = snap?.uploadedFiles ?? snap?.files ?? [];
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((f, i) => normalizeResponseFile(f, i)).filter(Boolean);
}

export function formatUploadFileSize(bytes) {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatUploadTimestamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mimeOrExt(type, name, predicate) {
  const t = String(type ?? '').toLowerCase();
  const ext = extFromName(name);
  return predicate(t, ext);
}

export function isImageResponseFile(file) {
  return mimeOrExt(file?.type, file?.name, (t, ext) =>
    t.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext));
}

export function isPdfResponseFile(file) {
  return mimeOrExt(file?.type, file?.name, (t, ext) =>
    t === 'application/pdf' || ext === 'pdf');
}

export function isVideoResponseFile(file) {
  return mimeOrExt(file?.type, file?.name, (t, ext) =>
    t.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext));
}

export function isAudioResponseFile(file) {
  return mimeOrExt(file?.type, file?.name, (t, ext) =>
    t.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext));
}

const NO_FILE_LABEL = 'No file uploaded.';

/**
 * Build structured upload answer payload for responses table / drawer / export.
 * @param {{ label?: string, type?: string }|null} screen
 * @param {object|undefined|null} snap
 */
export function buildUploadAnswerPayload(screen, snap) {
  const files = extractUploadFilesFromSnap(snap);
  const hasUploadFlag = String(snap?.previewFields?.uploadAns ?? '').trim().length > 0;
  const empty = files.length === 0 && !hasUploadFlag;

  return {
    kind: 'upload',
    files,
    value: empty ? NO_FILE_LABEL : files.map((f) => f.name).join(' · ') || NO_FILE_LABEL,
    displayText: empty ? NO_FILE_LABEL : files.map((f) => f.name).join(' · ') || NO_FILE_LABEL,
  };
}

/** Plain text for search, CSV export, and copy. */
export function uploadAnswerExportText(payload) {
  if (!payload || payload.kind !== 'upload') return '';
  if (!payload.files?.length) return NO_FILE_LABEL;
  return payload.files
    .map((f) => {
      const parts = [f.name];
      if (f.type) parts.push(f.type);
      if (f.size != null) parts.push(formatUploadFileSize(f.size));
      const url = f.downloadUrl ?? f.url;
      if (url) parts.push(url);
      return parts.join(' | ');
    })
    .join('; ');
}

/**
 * Triggers a browser download for a response file. Deliberately synchronous
 * (no fetch/await before the click) — cross-origin fetch against the storage
 * bucket has no CORS config, so an async fetch+blob attempt reliably fails,
 * and a fallback `window.open` after an await falls outside the browser's
 * user-gesture window and gets silently blocked. A direct anchor click stays
 * inside the gesture window and needs no CORS: same-origin/data/blob URLs
 * honor `download`, and cross-origin GCS URLs still open/save via the
 * browser's native handling.
 * @param {NormalizedResponseFile} file
 */
export function downloadResponseFile(file) {
  const url = file?.downloadUrl ?? file?.url;
  if (!url) return false;
  const filename = file.name || 'download';

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return true;
}

/** Table cell descriptor for upload answers. */
export function uploadAnswerTableCell(payload) {
  return {
    type: 'upload',
    value: payload?.displayText ?? NO_FILE_LABEL,
    files: payload?.files ?? [],
  };
}

export function cellDisplayText(cell) {
  if (cell && typeof cell === 'object' && cell.type === 'upload') {
    if (cell.files?.length) {
      return cell.files.map((f) => f.name).join(' ');
    }
    return cell.value ?? NO_FILE_LABEL;
  }
  return String(cell ?? '');
}
