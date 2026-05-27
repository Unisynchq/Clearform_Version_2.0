import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE ?? 'http://127.0.0.1:4175';
const USE_EXTERNAL_SERVER = Boolean(process.env.SMOKE_BASE);

const EMAIL = 'e2e-live-update@test.clearform.local';
const PASSWORD = 'SmokeTest123!';

function authInitScript({ email, password }) {
  const session = {
    isAuthenticated: true,
    email,
    firstName: 'Live',
    lastName: 'Update',
  };
  const accounts = {
    [email]: {
      email,
      firstName: 'Live',
      lastName: 'Update',
      password,
      updatedAt: Date.now(),
    },
  };
  localStorage.setItem('clearform_auth_session', JSON.stringify(session));
  localStorage.setItem('clearform_user_accounts', JSON.stringify(accounts));
}

function onboardingInitScript({ email, password }) {
  authInitScript({ email, password });
  localStorage.setItem('clearform_onboarding_active', 'true');
  localStorage.setItem('clearform_onboarding_step', '0');
  localStorage.removeItem('clearform_onboarding_complete');
}

async function startPreviewServer() {
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.js'),
    root: path.resolve(__dirname, '..'),
    server: { port: 4175, strictPort: true },
    preview: false,
  });
  await server.listen();
  return server;
}

async function run() {
  const server = USE_EXTERNAL_SERVER ? null : await startPreviewServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(authInitScript, { email: EMAIL, password: PASSWORD });

  const page = await context.newPage();
  const failures = [];

  try {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(500);
    await page.goto(`${BASE}/dashboard/form-builder`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /add screen/i }).first().click();
    await page.waitForTimeout(600);

    await page.getByRole('button', { name: 'Content', exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /add screen/i }).first().click();
    await page.waitForTimeout(600);

    const contactTile = page.getByRole('button', { name: 'Contact', exact: true });
    if (!(await contactTile.isVisible().catch(() => false))) {
      failures.push('Content panel: Contact tile not visible');
      throw new Error('Cannot proceed without Contact tile');
    }
    await contactTile.click();
    await page.waitForTimeout(1200);

    const defaultQuestion = 'How can we get in touch?';
    const canvasQuestion = page.getByLabel(/Question/i).first();
    if (!(await canvasQuestion.isVisible().catch(() => false))) {
      failures.push('Canvas: Contact question field not visible');
    } else {
      const canvasBefore = (await canvasQuestion.textContent())?.trim() ?? '';
      if (!canvasBefore.includes(defaultQuestion)) {
        failures.push(`Canvas sanity: expected default question, got "${canvasBefore}"`);
      }
    }

    const configurePanel = page.locator('div.w-\\[280px\\]').filter({ hasText: 'Configure' }).filter({ hasText: 'CONTACT' }).last();
    const questionInput = configurePanel.locator('label:has-text("Question")').locator('..').locator('input').first();
    if (!(await questionInput.isVisible().catch(() => false))) {
      failures.push('Contact configure: Question input not found');
      throw new Error('Cannot proceed without Question input');
    }

    const updatedQuestion = 'Reach us anytime';
    await questionInput.fill(updatedQuestion);
    await page.waitForTimeout(400);

    const canvasAfter = (await canvasQuestion.textContent())?.trim() ?? '';
    if (!canvasAfter.includes(updatedQuestion)) {
      failures.push(`Canvas: question did not update (got "${canvasAfter}")`);
    }

    const focused = await page.evaluate((el) => document.activeElement === el, await questionInput.elementHandle());
    if (!focused) failures.push('Contact configure: focus lost after typing');
  } catch (err) {
    failures.push(`Unhandled: ${err.message}`);
  } finally {
    await browser.close();
    if (server) await server.close();
  }

  if (failures.length) {
    console.error('CONFIGURE PANEL LIVE UPDATE TEST FAILED:\n');
    failures.forEach((f) => console.error(`• ${f}\n`));
    process.exit(1);
  }

  console.log('CONFIGURE PANEL LIVE UPDATE TEST PASSED: Contact panel typing updates canvas instantly');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
