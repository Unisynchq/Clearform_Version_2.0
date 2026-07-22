import { sanitizeAnswersByScreenId } from './sanitize-response-uploads.util';

describe('sanitizeAnswersByScreenId', () => {
  it('removes blob and data URLs from uploadedFiles', () => {
    const payload = {
      answersByScreenId: {
        '2': {
          uploadedFiles: [
            {
              name: 'photo.png',
              url: 'blob:http://localhost/abc',
              downloadUrl: 'blob:http://localhost/abc',
              type: 'image/png',
            },
            {
              name: 'doc.pdf',
              url: 'https://storage.googleapis.com/bucket/file.pdf',
              downloadUrl: 'https://storage.googleapis.com/bucket/file.pdf',
            },
          ],
        },
      },
    };

    const result = sanitizeAnswersByScreenId(payload);
    const files = (
      result.answersByScreenId as Record<string, { uploadedFiles: unknown[] }>
    )['2'].uploadedFiles;

    expect(files[0]).toEqual({
      name: 'photo.png',
      type: 'image/png',
    });
    expect(files[1]).toEqual({
      name: 'doc.pdf',
      url: 'https://storage.googleapis.com/bucket/file.pdf',
      downloadUrl: 'https://storage.googleapis.com/bucket/file.pdf',
    });
  });

  it('returns payload unchanged when answersByScreenId is absent', () => {
    const payload = { completed: true };
    expect(sanitizeAnswersByScreenId(payload)).toEqual(payload);
  });
});
