function isEphemeralUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  return url.startsWith('blob:') || url.startsWith('data:');
}

function sanitizeUploadedFile(file: unknown): unknown {
  if (!file || typeof file !== 'object' || Array.isArray(file)) return file;
  const f = { ...(file as Record<string, unknown>) };
  for (const key of ['url', 'downloadUrl', 'href', 'src', 'dataUrl']) {
    if (isEphemeralUrl(f[key])) {
      delete f[key];
    }
  }
  return f;
}

/** Strip browser-only blob:/data: URLs from upload answers before persistence. */
export function sanitizeAnswersByScreenId(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const answers = payload.answersByScreenId;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return payload;
  }

  const out: Record<string, unknown> = {};
  for (const [screenId, snap] of Object.entries(
    answers as Record<string, unknown>,
  )) {
    if (!snap || typeof snap !== 'object' || Array.isArray(snap)) {
      out[screenId] = snap;
      continue;
    }
    const s = { ...(snap as Record<string, unknown>) };
    const files = s.uploadedFiles;
    if (Array.isArray(files)) {
      s.uploadedFiles = files.map(sanitizeUploadedFile);
    }
    out[screenId] = s;
  }

  return { ...payload, answersByScreenId: out };
}
