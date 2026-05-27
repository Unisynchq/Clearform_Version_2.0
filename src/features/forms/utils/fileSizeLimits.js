/** Parse configure-panel labels like "25 MB" or "No limit" into a byte cap. */
export function parseMaxFileSizeBytes(label) {
  if (!label || label === 'No limit') return Infinity;
  const match = String(label).trim().match(/^([\d.]+)\s*(MB|KB|GB)?$/i);
  if (!match) return Infinity;
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();
  if (unit === 'KB') return value * 1024;
  if (unit === 'GB') return value * 1024 * 1024 * 1024;
  return value * 1024 * 1024;
}

/** Compact display for error copy — e.g. 180MB, 25MB (matches Figma). */
export function formatFileSizeCompact(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb % 1 === 0 ? gb : gb.toFixed(1)}GB`;
  }
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb % 1 === 0 ? mb : mb.toFixed(1)}MB`;
  }
  const kb = bytes / 1024;
  return `${kb % 1 === 0 ? kb : kb.toFixed(0)}KB`;
}

/** Turn "25 MB" into "25MB" for the max-allowed line in the error state. */
export function formatMaxSizeLabel(label) {
  if (!label || label === 'No limit') return 'No limit';
  return String(label).replace(/\s+/g, '');
}
