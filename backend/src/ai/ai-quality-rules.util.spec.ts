import {
  classifyQualityViolation,
  hasKeyboardMashSegment,
  isMashToken,
  lacksSemanticConnection,
  isFillerHeavy,
  isHostileDismissive,
  buildGibberishResult,
  resolveViolationLevelHint,
} from './ai-quality-rules.util';
import { hasPhraseStutter } from './quality/question-signals.util';
import { containsProfanity } from './profanity-lists';

const MASH_ANSWER =
  'need to be fnkjewdbkjknewlkvklkslnvnwdvml;wenlivwonvw;djvohewohfgoi23hpofp2yoc 3ojpoh|';

const GIBBERISH_LONG =
  'klymeoivboifdvlkefnoivbheoivmd, kvpberkvmvh3iromQuijkewdnknklewjoivhewion';

const LIFE_GOAL_Q = 'What is your goal in life *';

const EXPERIENCE_QUESTION =
  'How is your experience filling out this form? Share any feedback.';

const EXPERIENCE_TYPO_QUESTION =
  'How is your experiance with filling this form';

const BREVITY_HELPER = "Share as much or as little as you'd like.";

describe('ai-quality-rules.util (classifier)', () => {
  it('flags keyboard mash segments', () => {
    expect(hasKeyboardMashSegment(MASH_ANSWER)).toBe(true);
  });

  it('returns red gibberish template for keyboard mash', () => {
    const result = buildGibberishResult();
    expect(result.level).toBe('red');
    expect(result.message).not.toMatch(/keyboard mashing/i);
  });

  it('classifies long gibberish as pure_gibberish not too_short', () => {
    expect(classifyQualityViolation(GIBBERISH_LONG, LIFE_GOAL_Q)).toBe(
      'pure_gibberish',
    );
  });

  it('classifies English profanity before too_short', () => {
    expect(classifyQualityViolation('Fuck you', LIFE_GOAL_Q)).toBe('profanity');
  });

  it('classifies short profanity on goal question', () => {
    expect(classifyQualityViolation('My goal is fuck', LIFE_GOAL_Q)).toBe(
      'profanity',
    );
  });

  it('detects Hindi transliterated profanity', () => {
    expect(
      containsProfanity('My goal is fuck and u fuck off bitch suyar ka bachaa'),
    ).toBe(true);
    expect(
      classifyQualityViolation(
        'Very bad .. fucking asshole . You asshole and madharchod',
        EXPERIENCE_QUESTION,
      ),
    ).toBe('profanity');
  });

  it('does not false-positive assassin', () => {
    expect(containsProfanity('I want to be an assassin in games')).toBe(false);
  });

  it('classifies hostile dismissive answer', () => {
    expect(
      classifyQualityViolation('Who are you to ask me this', LIFE_GOAL_Q),
    ).toBe('hostile_dismissive');
    expect(isHostileDismissive('Who are you to ask me this')).toBe(true);
  });

  it('classifies circular vague goal answer as low_value', () => {
    expect(
      classifyQualityViolation('Goal is goal and fine is life', LIFE_GOAL_Q),
    ).toBe('low_value');
    expect(isFillerHeavy('Goal is goal and fine is life', LIFE_GOAL_Q)).toBe(
      true,
    );
  });

  it('classifies filler-heavy astronaut answer as low_value', () => {
    const text =
      'astraunaut and be an amaxing guy with nth and nth else and then whatever';
    expect(classifyQualityViolation(text, LIFE_GOAL_Q)).toBe('low_value');
  });

  it('does not flag evaluative short answer as disconnected from improvement question', () => {
    expect(
      lacksSemanticConnection(
        'It was confusing.',
        'What could we improve about your onboarding experience?',
      ),
    ).toBe(false);
  });

  it('classifies color-list answer as off_topic', () => {
    expect(
      classifyQualityViolation(
        'red blue green yellow',
        'What do you do professionally?',
      ),
    ).toBe('off_topic');
  });

  it('does not mash-flag common English words like instructions', () => {
    expect(isMashToken('instructions')).toBe(false);
    expect(isMashToken('workspace')).toBe(false);
    expect(isMashToken('synthetic')).toBe(false);
  });

  it('classifies dismissive hackathon answer as low_value not gibberish', () => {
    const question =
      'How is your experiance with participating in this hackathon , what you like the most?';
    const answer =
      'It was great and i like this hackathon. I dont want to write synthetic answers okay . I want to give honest answer but i will not give that .';
    expect(isMashToken('synthetic')).toBe(false);
    expect(hasKeyboardMashSegment(answer)).toBe(false);
    expect(classifyQualityViolation(answer, question)).toBe('low_value');
    expect(classifyQualityViolation(answer, question)).not.toBe(
      'pure_gibberish',
    );
  });

  describe('experience / feedback (classifier)', () => {
    it('does not classify evaluative answer on typo experience question as off_topic', () => {
      expect(
        classifyQualityViolation(
          'It was super confusing',
          EXPERIENCE_TYPO_QUESTION,
        ),
      ).not.toBe('off_topic');
      expect(
        lacksSemanticConnection(
          'It was super confusing',
          EXPERIENCE_TYPO_QUESTION,
        ),
      ).toBe(false);
    });

    it('still returns profanity on experience typo question', () => {
      expect(
        classifyQualityViolation(
          'Fucking asshole experiance',
          EXPERIENCE_TYPO_QUESTION,
        ),
      ).toBe('profanity');
    });

    it('never returns off_topic for brevity-helper short evaluative answer', () => {
      expect(
        classifyQualityViolation(
          'It was super confusing',
          EXPERIENCE_QUESTION,
          BREVITY_HELPER,
        ),
      ).not.toBe('off_topic');
    });
  });

  describe('project / artifact questions', () => {
    it('does not flag backend main.py answer as off_topic on project fix question', () => {
      const question =
        'What specific thing you want to make correct in your project';
      const answer = 'backend main.py file have to be changed';
      expect(lacksSemanticConnection(answer, question)).toBe(false);
      expect(classifyQualityViolation(answer, question)).not.toBe('off_topic');
    });

    it('does not flag src/main.py path as gibberish on project fix question', () => {
      const question =
        'What specific thing you want to make correct in your project';
      const answer =
        "I want to correct my project's backend src/main.py file so that i should catch correct routes and bypass the latency issues";
      expect(isMashToken('src/main.py')).toBe(false);
      expect(classifyQualityViolation(answer, question)).not.toBe(
        'pure_gibberish',
      );
      expect(classifyQualityViolation(answer, question)).not.toBe('off_topic');
    });
  });

  describe('founder yellow refinement fixtures', () => {
    const achievementQ =
      'Describe your most significant professional achievement';

    it('phrase stutter → low_value with red level hint (Ex-3)', () => {
      const text = 'working with working with working';
      expect(hasPhraseStutter(text)).toBe(true);
      expect(classifyQualityViolation(text, achievementQ)).toBe('low_value');
      expect(resolveViolationLevelHint('low_value', text)).toBe('red');
    });

    it('Word 365 specific issue is not off-topic (Ex-4)', () => {
      const text = 'I fixed a very specific issue in Microsoft Word 365.';
      expect(classifyQualityViolation(text, achievementQ)).not.toBe(
        'off_topic',
      );
    });
  });
});
