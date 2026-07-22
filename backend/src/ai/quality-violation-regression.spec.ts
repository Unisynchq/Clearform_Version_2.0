import { classifyQualityViolation } from './ai-quality-rules.util';

describe('screenshot regressions 2026-07-02', () => {
  const q = 'What specific thing you want to make correct in your project';
  it('flags "stay out of my way" as hostile', () => {
    expect(
      classifyQualityViolation(
        'dont have to change anything in my project so stay out of my way okay !!',
        q,
      ),
    ).toBe('hostile_dismissive');
  });
  it('flags "duffer ... what should write then" as hostile or low_value', () => {
    const kind = classifyQualityViolation(
      'I dont know duffer - okay so what should write then?',
      q,
    );
    expect(['hostile_dismissive', 'low_value']).toContain(kind);
  });
  it('keeps a legitimate answer clean', () => {
    expect(
      classifyQualityViolation(
        'Okay so i want to change the production pipeline in my project',
        q,
      ),
    ).toBe('none');
  });
});
