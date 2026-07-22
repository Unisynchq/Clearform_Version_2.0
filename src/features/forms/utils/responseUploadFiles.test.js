import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildUploadAnswerPayload,
  downloadResponseFile,
  extractUploadFilesFromSnap,
  isImageResponseFile,
  isUploadQuestionLabel,
  normalizeResponseFile,
  uploadAnswerExportText,
} from './responseUploadFiles';
import {
  buildResponseFromPreview,
  responseToTableRow,
  responsesExportToCsv,
} from './formResponseBuilder';

describe('responseUploadFiles', () => {
  it('detects upload question labels', () => {
    expect(isUploadQuestionLabel('Upload')).toBe(true);
    expect(isUploadQuestionLabel('Multi-image upload')).toBe(true);
    expect(isUploadQuestionLabel('Video Upload')).toBe(true);
    expect(isUploadQuestionLabel('Short text')).toBe(false);
  });

  it('normalizes file metadata from API shapes', () => {
    const file = normalizeResponseFile({
      filename: 'report.pdf',
      downloadUrl: 'https://cdn.example.com/report.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      createdAt: '2026-07-01T10:00:00.000Z',
    });
    expect(file?.name).toBe('report.pdf');
    expect(file?.downloadUrl).toBe('https://cdn.example.com/report.pdf');
    expect(file?.size).toBe(2048);
    expect(file?.type).toBe('application/pdf');
  });

  it('returns No file uploaded when snap is empty', () => {
    const payload = buildUploadAnswerPayload({ label: 'Upload' }, { uploadedFiles: [] });
    expect(payload.displayText).toBe('No file uploaded.');
    expect(payload.files).toHaveLength(0);
  });

  it('builds export text with filename and download URL', () => {
    const payload = buildUploadAnswerPayload(
      { label: 'Upload' },
      {
        uploadedFiles: [{
          name: 'photo.png',
          type: 'image/png',
          size: 1024,
          url: 'https://cdn.example.com/photo.png',
        }],
      },
    );
    const text = uploadAnswerExportText(payload);
    expect(text).toContain('photo.png');
    expect(text).toContain('https://cdn.example.com/photo.png');
  });

  it('identifies image files for thumbnail preview', () => {
    expect(isImageResponseFile({ type: 'image/png', name: 'a.png' })).toBe(true);
    expect(isImageResponseFile({ type: 'application/pdf', name: 'a.pdf' })).toBe(false);
  });
});

describe('formResponseBuilder upload answers', () => {
  const screens = [
    { id: 1, type: 'intro', label: 'Intro' },
    { id: 2, type: 'content', label: 'Upload', config: {} },
    { id: 3, type: 'end', label: 'End' },
  ];

  it('buildResponseFromPreview attaches file metadata to upload answers', () => {
    const response = buildResponseFromPreview({
      formId: 1,
      screens,
      snapsByScreenId: {
        2: {
          uploadedFiles: [{
            name: 'doc.pdf',
            type: 'application/pdf',
            size: 500,
            url: 'https://example.com/doc.pdf',
            uploadedAt: '2026-07-01T12:00:00.000Z',
          }],
          previewFields: { uploadAns: 'uploaded' },
        },
      },
    });
    expect(response.answers[0].kind).toBe('upload');
    expect(response.answers[0].files[0].name).toBe('doc.pdf');
    expect(response.answers[0].value).toBe('doc.pdf');
  });

  it('responseToTableRow renders upload cells with file list', () => {
    const row = responseToTableRow({
      contact: '—',
      status: 'completed',
      answers: [{
        kind: 'upload',
        value: 'doc.pdf',
        files: [{ id: '1', name: 'doc.pdf', url: 'https://example.com/doc.pdf', downloadUrl: 'https://example.com/doc.pdf', type: 'application/pdf', size: 500, uploadedAt: null }],
      }],
    });
    expect(row[3].type).toBe('upload');
    expect(row[3].files).toHaveLength(1);
  });

  it('responsesExportToCsv includes file URLs', () => {
    const csv = responsesExportToCsv(
      [{
        contact: '—',
        status: 'completed',
        answers: [{
          kind: 'upload',
          label: 'Upload',
          value: 'doc.pdf',
          files: [{ name: 'doc.pdf', downloadUrl: 'https://example.com/doc.pdf', type: 'application/pdf', size: 100, uploadedAt: null }],
        }],
      }],
      ['Contact', 'Time', 'Type', 'Upload'],
    );
    expect(csv).toContain('doc.pdf');
    expect(csv).toContain('https://example.com/doc.pdf');
  });
});

describe('downloadResponseFile', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads blob URLs via anchor click', async () => {
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(v) { this._href = v; },
      get href() { return this._href; },
      set download(v) { this._download = v; },
      click,
      rel: '',
    });

    const ok = await downloadResponseFile({
      name: 'test.png',
      url: 'blob:http://localhost/abc',
      downloadUrl: 'blob:http://localhost/abc',
      type: 'image/png',
      size: 10,
      uploadedAt: null,
      id: '1',
    });
    expect(ok).toBe(true);
    expect(click).toHaveBeenCalled();
    appendChild.mockRestore();
    removeChild.mockRestore();
  });
});
