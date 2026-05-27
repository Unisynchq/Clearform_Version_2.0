import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE ?? 'http://127.0.0.1:4174';
const USE_EXTERNAL_SERVER = Boolean(process.env.SMOKE_BASE);
const FORM_ID = 42;

const publishedDraft = {
  formId: FORM_ID,
  formTitle: 'Logic publish test',
  screens: [
    { id: 1, type: 'intro', name: 'Start Screen', label: 'Start' },
    {
      id: 2,
      type: 'content',
      name: 'Question',
      label: 'Single',
      config: {
        singleQuestion: 'Pick one',
        singleOptions: ['Yes', 'No'],
      },
    },
    {
      id: 3,
      type: 'content',
      name: 'Follow up',
      label: 'Short text',
      config: { shortTextQuestion: 'Details' },
    },
    { id: 4, type: 'end', name: 'End Screen', label: 'End' },
  ],
  intro: { title: 'Start', description: '', buttonText: 'Start' },
  end: { title: 'Thanks', description: '', buttonText: 'Done' },
  logicConnections: [
    { from: 2, to: 3, kind: 'if' },
    { from: 2, to: 4, kind: 'next' },
  ],
  logicIfRulesByEdge: {
    '2-3': {
      rules: [
        {
          id: 'r1',
          thenScreenId: 3,
          conditions: [
            {
              sourceScreenId: 2,
              fieldId: 'multiple-choice',
              operator: 'includes',
              value: 'Yes',
            },
          ],
        },
      ],
      elseScreenId: 4,
    },
  },
  publishedAt: Date.now(),
};

function publishedFormInitScript({ formId, draft }) {
  const forms = [
    {
      id: formId,
      title: draft.formTitle,
      status: 'live',
      responses: 0,
      updatedAt: Date.now(),
    },
  ];
  localStorage.setItem('clearform_user_forms', JSON.stringify(forms));
  localStorage.setItem(`clearform_published_${formId}`, JSON.stringify(draft));
  localStorage.setItem('clearform_onboarding_complete', 'true');
}

async function startPreviewServer() {
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.js'),
    root: path.resolve(__dirname, '..'),
    server: { port: 4174, strictPort: true },
    preview: false,
  });
  await server.listen();
  return server;
}

async function run() {
  const server = USE_EXTERNAL_SERVER ? null : await startPreviewServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(publishedFormInitScript, { formId: FORM_ID, draft: publishedDraft });
  const page = await context.newPage();
  const failures = [];

  try {
    await page.goto(`${BASE}/f/${FORM_ID}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(600);

    if (!(await page.getByText('Logic publish test').first().isVisible().catch(() => false))) {
      failures.push('Public form: title not visible');
    }

    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(400);

    if (!(await page.getByRole('heading', { name: 'Pick one' }).isVisible().catch(() => false))) {
      failures.push('Public form: Single question not shown after Start');
    }

    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(400);

    if (!(await page.getByRole('heading', { name: 'Details' }).isVisible().catch(() => false))) {
      failures.push('Public form: if-branch did not route to Short text after Yes');
    }

    await page.getByRole('button', { name: 'Back' }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(400);

    if (!(await page.getByRole('heading', { name: 'Thanks' }).isVisible().catch(() => false))) {
      failures.push('Public form: else-branch did not route to End after No');
    }
  } catch (err) {
    failures.push(`Unhandled: ${err.message}`);
  } finally {
    await browser.close();
    if (server) await server.close();
  }

  if (failures.length) {
    console.error('PUBLISHED FORM E2E FAILED:\n');
    failures.forEach((f) => console.error(`• ${f}\n`));
    process.exit(1);
  }

  console.log('PUBLISHED FORM E2E PASSED: /f/:formId live logic branches Yes→follow-up, No→end.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
