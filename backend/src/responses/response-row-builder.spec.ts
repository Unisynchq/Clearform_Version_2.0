import {
  buildResponseCells,
  buildResponseColumns,
  buildResponsesCsv,
  buildResponseRowForXlsx,
  cellTextWithLinks,
  extractAnswersMap,
  extractUploadFiles,
  guardCellText,
} from './response-row-builder';

const snapshot = {
  screens: [
    { id: 1, type: 'intro', label: 'Intro' },
    {
      id: 2,
      type: 'content',
      label: 'Short text',
      config: { shortTextQuestion: 'What went wrong?' },
    },
    {
      id: 3,
      type: 'content',
      label: 'Rating',
      config: { ratingQuestion: 'How annoyed are you?' },
    },
    {
      id: 4,
      type: 'content',
      label: 'Upload',
      config: { uploadQuestion: 'Attach a screenshot' },
    },
    { id: 5, type: 'end', label: 'End' },
  ],
};

const uploadedFiles = [
  { name: 'bug.png', url: 'https://storage.googleapis.com/b/bug.png' },
  {
    name: 'log.pdf',
    downloadUrl: 'https://storage.googleapis.com/b/log.pdf',
  },
];

function currentShapePayload() {
  return {
    submittedAt: '2026-07-17T10:00:00.000Z',
    completed: true,
    answersByScreenId: {
      '2': { shortTextDraft: 'The export button, does "nothing"' },
      '3': { ratingValue: 2 },
      '4': { uploadedFiles },
    },
  };
}

function makeResponse(payload: unknown, id = 'resp-1') {
  return {
    id,
    createdAt: new Date('2026-07-17T10:00:01.000Z'),
    status: 'PROCESSED',
    qualityScore: 87,
    payload,
  };
}

describe('buildResponseColumns', () => {
  it('emits one column per content screen in form order with question text', () => {
    expect(buildResponseColumns(snapshot)).toEqual([
      { screenId: '2', header: 'What went wrong?' },
      { screenId: '3', header: 'How annoyed are you?' },
      { screenId: '4', header: 'Attach a screenshot' },
    ]);
  });

  it('uses uploadQuestion config for upload screens (label fallback drift fix)', () => {
    const cols = buildResponseColumns(snapshot);
    expect(cols[2].header).toBe('Attach a screenshot');
  });

  it('returns empty for missing snapshot', () => {
    expect(buildResponseColumns(null)).toEqual([]);
    expect(buildResponseColumns({})).toEqual([]);
  });
});

describe('extractAnswersMap', () => {
  it('reads top-level answersByScreenId', () => {
    expect(extractAnswersMap(currentShapePayload())).toMatchObject({
      '3': { ratingValue: 2 },
    });
  });

  it('reads legacy nested data.answersByScreenId', () => {
    const nested = {
      data: { answersByScreenId: { '2': { shortTextDraft: 'hi' } } },
    };
    expect(extractAnswersMap(nested)).toEqual({
      '2': { shortTextDraft: 'hi' },
    });
  });

  it('returns null for legacy answers[] and malformed payloads', () => {
    expect(extractAnswersMap({ answers: [] })).toBeNull();
    expect(extractAnswersMap(null)).toBeNull();
    expect(extractAnswersMap('junk')).toBeNull();
    expect(extractAnswersMap({ answersByScreenId: [1, 2] })).toBeNull();
  });
});

describe('buildResponseCells', () => {
  const columns = buildResponseColumns(snapshot);

  it('formats current-shape answers per column', () => {
    const cells = buildResponseCells(snapshot, columns, currentShapePayload());
    expect(cells.map((c) => c.text)).toEqual([
      'The export button, does "nothing"',
      '2',
      'bug.png · log.pdf',
    ]);
  });

  it('collects hosted file links (url or downloadUrl) for upload screens only', () => {
    const cells = buildResponseCells(snapshot, columns, currentShapePayload());
    expect(cells[0].files).toEqual([]);
    expect(cells[2].files).toEqual([
      { name: 'bug.png', url: 'https://storage.googleapis.com/b/bug.png' },
      { name: 'log.pdf', url: 'https://storage.googleapis.com/b/log.pdf' },
    ]);
  });

  it('handles nested data.answersByScreenId shape', () => {
    const payload = { data: currentShapePayload() };
    const cells = buildResponseCells(snapshot, columns, payload);
    expect(cells[1].text).toBe('2');
  });

  it('falls back to legacy answers[] rows matched by screenId', () => {
    const payload = {
      answers: [
        { screenId: 2, label: 'What went wrong?', value: 'Legacy answer' },
        { screenId: 3, label: 'How annoyed are you?', value: '5' },
      ],
    };
    const cells = buildResponseCells(snapshot, columns, payload);
    expect(cells.map((c) => c.text)).toEqual(['Legacy answer', '5', '—']);
  });

  it('skips legacy rows holding raw snap JSON', () => {
    const payload = {
      answers: [{ screenId: 2, value: '{"shortTextDraft":"raw"}' }],
    };
    const cells = buildResponseCells(snapshot, columns, payload);
    expect(cells[0].text).toBe('—');
  });

  it('returns em-dash cells for malformed/empty payloads', () => {
    for (const payload of [null, undefined, 'junk', {}, { answers: 'x' }]) {
      const cells = buildResponseCells(snapshot, columns, payload);
      expect(cells.map((c) => c.text)).toEqual(['—', '—', '—']);
    }
  });

  it('ignores ephemeral blob:/data: upload URLs', () => {
    const payload = {
      answersByScreenId: {
        '4': {
          uploadedFiles: [
            { name: 'ok.png', url: 'https://x/ok.png' },
            { name: 'gone.png', url: 'blob:https://app/123' },
            { name: 'inline.png', url: 'data:image/png;base64,xx' },
          ],
        },
      },
    };
    const cells = buildResponseCells(snapshot, columns, payload);
    expect(cells[2].files).toEqual([
      { name: 'ok.png', url: 'https://x/ok.png' },
    ]);
  });
});

describe('cellTextWithLinks', () => {
  it('single file → bare URL', () => {
    expect(
      cellTextWithLinks({
        text: 'x.png',
        files: [{ name: 'x.png', url: 'https://u/x' }],
      }),
    ).toBe('https://u/x');
  });

  it('multiple files → name (url) list', () => {
    expect(
      cellTextWithLinks({
        text: 'a · b',
        files: [
          { name: 'a', url: 'https://u/a' },
          { name: 'b', url: 'https://u/b' },
        ],
      }),
    ).toBe('a (https://u/a); b (https://u/b)');
  });

  it('no files → plain text', () => {
    expect(cellTextWithLinks({ text: 'hello', files: [] })).toBe('hello');
  });
});

describe('guardCellText (formula injection)', () => {
  it('prefixes formula-leading cells', () => {
    expect(guardCellText('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`);
    expect(guardCellText('+SUM(A1)')).toBe(`'+SUM(A1)`);
    expect(guardCellText('@cmd')).toBe(`'@cmd`);
    expect(guardCellText('-cmd')).toBe(`'-cmd`);
  });

  it('leaves numbers, dashes-as-empty and normal text alone', () => {
    expect(guardCellText('-5')).toBe('-5');
    expect(guardCellText('-5.2')).toBe('-5.2');
    expect(guardCellText('—')).toBe('—');
    expect(guardCellText('hello')).toBe('hello');
  });
});

describe('buildResponsesCsv', () => {
  it('builds header + one row per response with proper quoting', () => {
    const csv = buildResponsesCsv(snapshot, [
      makeResponse(currentShapePayload()),
    ]);
    const lines = csv.trimEnd().split('\n');
    expect(lines[0]).toBe(
      'Response ID,Submitted At,Status,Quality Score,What went wrong?,How annoyed are you?,Attach a screenshot',
    );
    expect(lines).toHaveLength(2);
    // Quoted because the answer contains a comma and quotes.
    expect(lines[1]).toContain('"The export button, does ""nothing"""');
    // Multiple uploads → name (url) pairs.
    expect(lines[1]).toContain(
      'bug.png (https://storage.googleapis.com/b/bug.png)',
    );
  });

  it('emits real header row for a form with zero responses', () => {
    const csv = buildResponsesCsv(snapshot, []);
    expect(csv).toBe(
      'Response ID,Submitted At,Status,Quality Score,What went wrong?,How annoyed are you?,Attach a screenshot\n',
    );
  });

  it('quotes cells containing newlines', () => {
    const payload = {
      answersByScreenId: { '2': { shortTextDraft: 'line1\nline2' } },
    };
    const csv = buildResponsesCsv(snapshot, [makeResponse(payload)]);
    expect(csv).toContain('"line1\nline2"');
  });

  it('guards formula injection in answer cells', () => {
    const payload = {
      answersByScreenId: { '2': { shortTextDraft: '=2+2' } },
    };
    const csv = buildResponsesCsv(snapshot, [makeResponse(payload)]);
    expect(csv).toContain(`'=2+2`);
  });

  it('works with builder-snapshot-only (draft) forms', () => {
    const draftSnapshot = {
      screens: [
        {
          id: 9,
          type: 'content',
          label: 'Long text',
          config: { longTextQuestion: 'Draft question' },
        },
      ],
    };
    const csv = buildResponsesCsv(draftSnapshot, []);
    expect(csv).toContain('Draft question');
  });
});

describe('buildResponseRowForXlsx', () => {
  it('emits values with file names as text plus cells carrying links', () => {
    const columns = buildResponseColumns(snapshot);
    const { values, cells } = buildResponseRowForXlsx(
      snapshot,
      columns,
      makeResponse(currentShapePayload()),
    );
    expect(values[0]).toBe('resp-1');
    expect(values[3]).toBe(87);
    // Multiple files: text lists name (url) pairs.
    expect(values[6]).toContain('bug.png (');
    expect(cells[2].files[0].url).toBe(
      'https://storage.googleapis.com/b/bug.png',
    );
  });

  it('truncates giant cells below the Excel limit', () => {
    const columns = buildResponseColumns(snapshot);
    const payload = {
      answersByScreenId: { '2': { shortTextDraft: 'x'.repeat(40_000) } },
    };
    const { values } = buildResponseRowForXlsx(
      snapshot,
      columns,
      makeResponse(payload),
    );
    expect(String(values[4]).length).toBeLessThanOrEqual(32_001);
  });
});

describe('extractUploadFiles', () => {
  it('handles missing/invalid snaps', () => {
    expect(extractUploadFiles(undefined)).toEqual([]);
    expect(extractUploadFiles({})).toEqual([]);
    expect(extractUploadFiles({ uploadedFiles: 'nope' })).toEqual([]);
  });
});
