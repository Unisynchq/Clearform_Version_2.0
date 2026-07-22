/**
 * Batch-run response-quality classifier fixtures (deterministic gates only).
 *
 * Usage: npx ts-node scripts/eval-quality-fixtures.ts
 */
import {
  classifyQualityViolation,
  violationKindToLevel,
} from '../src/ai/ai-quality-rules.util';

type Fixture = {
  name: string;
  question: string;
  answer: string;
  helper?: string;
  expectViolation?: string | null;
  expectLevel?: 'green' | 'amber' | 'red';
};

const FIXTURES: Fixture[] = [
  {
    name: 'typo experience + evaluative (not off_topic)',
    question: 'How is your experiance with filling this form',
    answer: 'It was super confusing',
    expectViolation: null,
  },
  {
    name: 'typo experience + profanity',
    question: 'How is your experiance with filling this form',
    answer: 'Fucking asshole experiance',
    expectViolation: 'profanity',
    expectLevel: 'red',
  },
  {
    name: 'brevity helper + evaluative',
    question: 'How is your experience filling out this form?',
    answer: 'It was super confusing',
    helper: "Share as much or as little as you'd like.",
    expectViolation: null,
  },
  {
    name: 'color list off-topic',
    question: 'What do you do professionally?',
    answer: 'red blue green yellow',
    expectViolation: 'off_topic',
    expectLevel: 'amber',
  },
  {
    name: 'keyboard mash',
    question: 'What is your goal in life *',
    answer: 'need to be fnkjewdbkjknewlkvklkslnvnwdvml',
    expectViolation: 'pure_gibberish',
    expectLevel: 'red',
  },
  {
    name: 'job app: 23 years factual_short (no classifier violation)',
    question: 'How many years of relevant experience do you have?',
    answer: 'I have 23 years of expereince',
    helper: 'Allows us to understand your experience',
    expectViolation: null,
  },
  {
    name: 'form feedback not job years',
    question: 'How is your experience with filling this form',
    answer: 'It was super confusing',
    expectViolation: null,
  },
];

function violationLabel(kind: string | null | undefined): string {
  return kind ?? 'none';
}

function noViolation(kind: string | undefined): boolean {
  return kind == null || kind === 'none' || kind === 'low_value';
}

function main(): void {
  let failed = 0;

  for (const fx of FIXTURES) {
    const violation = classifyQualityViolation(fx.answer, fx.question, fx.helper);
    const violationOk =
      fx.expectViolation === undefined ||
      (fx.expectViolation === null
        ? noViolation(violation)
        : violation === fx.expectViolation);

    const level =
      fx.expectLevel && violation && violation !== 'none' && violation !== 'low_value'
        ? violationKindToLevel(violation)
        : undefined;
    const levelOk = !fx.expectLevel || level === fx.expectLevel;
    const ok = violationOk && levelOk;
    if (!ok) failed += 1;

    console.log(`${ok ? '✓' : '✗'} ${fx.name}`);
    console.log(`  violation: ${violationLabel(violation)} (expected ${fx.expectViolation ?? 'any'})`);
    if (fx.expectLevel) {
      console.log(`  level: ${level ?? '—'} (expected ${fx.expectLevel})`);
    }
    console.log('');
  }

  if (failed > 0) {
    console.error(`${failed} fixture(s) failed`);
    process.exit(1);
  }
  console.log('All fixtures passed.');
}

main();
