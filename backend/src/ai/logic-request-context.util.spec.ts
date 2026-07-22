import { buildLogicRequestContext } from './logic-request-context.util';

describe('buildLogicRequestContext', () => {
  it('builds logic context from posted builder state', () => {
    const context = buildLogicRequestContext(
      'form-1',
      {
        screens: [
          { id: 1, type: 'intro', label: 'Welcome' },
          {
            id: 2,
            type: 'content',
            label: 'Short text',
            config: { shortTextQuestion: 'What is your role?' },
          },
          { id: 3, type: 'end', label: 'Thanks' },
        ],
        contentScreens: [
          {
            id: 2,
            label: 'What is your role?',
            fields: [{ id: 'short-text' }],
            fieldType: 'short_text',
          },
        ],
        formTitle: 'Builder draft',
      },
      'Persisted title',
    );

    expect(context.title).toBe('Builder draft');
    expect(context.snapshot).toMatchObject({
      title: 'Builder draft',
    });
    expect(context.contentScreens).toEqual([
      {
        id: 2,
        label: 'What is your role?',
        fields: [{ id: 'short-text' }],
        fieldType: 'short_text',
      },
    ]);
    expect(context.screens).toEqual([
      expect.objectContaining({
        screenId: 2,
        label: 'What is your role?',
      }),
    ]);
    expect(context.screenLabels).toEqual(['What is your role?']);
  });
});
