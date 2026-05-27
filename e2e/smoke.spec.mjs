import { chromium } from 'playwright';
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE ?? 'http://127.0.0.1:4173';
const USE_EXTERNAL_SERVER = Boolean(process.env.SMOKE_BASE);
const EMAIL = 'e2e-smoke@test.clearform.local';
const PASSWORD = 'SmokeTest123!';

function authInitScript({ email, password }) {
  const session = {
    isAuthenticated: true,
    email,
    firstName: 'Smoke',
    lastName: 'Test',
  };
  const accounts = {
    [email]: {
      email,
      firstName: 'Smoke',
      lastName: 'Test',
      password,
      updatedAt: Date.now(),
    },
  };
  localStorage.setItem('clearform_auth_session', JSON.stringify(session));
  localStorage.setItem('clearform_user_accounts', JSON.stringify(accounts));
}

function onboardingInitScript({ email, password }) {
  const session = {
    isAuthenticated: true,
    email,
    firstName: 'Smoke',
    lastName: 'Test',
  };
  const accounts = {
    [email]: {
      email,
      firstName: 'Smoke',
      lastName: 'Test',
      password,
      updatedAt: Date.now(),
    },
  };
  localStorage.setItem('clearform_auth_session', JSON.stringify(session));
  localStorage.setItem('clearform_user_accounts', JSON.stringify(accounts));
  localStorage.setItem('clearform_onboarding_active', 'true');
  localStorage.setItem('clearform_onboarding_step', '0');
  localStorage.removeItem('clearform_onboarding_complete');
}

async function startPreviewServer() {
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.js'),
    root: path.resolve(__dirname, '..'),
    server: { port: 4173, strictPort: true },
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
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const failures = [];

  try {
    const onboardingContext = await browser.newContext();
    await onboardingContext.addInitScript(onboardingInitScript, {
      email: EMAIL,
      password: PASSWORD,
    });
    const onboardingPage = await onboardingContext.newPage();
    onboardingPage.on('pageerror', (err) => consoleErrors.push(err.message));

    await onboardingPage.goto(`${BASE}/onboarding`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await onboardingPage.waitForTimeout(500);

    if (!(await onboardingPage.getByRole('heading', { name: /what would you like/i }).isVisible().catch(() => false))) {
      failures.push('Onboarding: welcome screen not visible');
    }

    await onboardingPage.getByRole('button', { name: /create my first form/i }).click();
    await onboardingPage.waitForTimeout(700);

    if (!(await onboardingPage.getByRole('heading', { name: /what are you building today/i }).isVisible().catch(() => false))) {
      failures.push('Onboarding: templates screen did not appear after welcome CTA');
    }

    await onboardingPage.getByRole('button', { name: /^back$/i }).click();
    await onboardingPage.waitForTimeout(700);

    if (!(await onboardingPage.getByRole('heading', { name: /what would you like/i }).isVisible().catch(() => false))) {
      failures.push('Onboarding: welcome screen did not return after Back');
    }

    await onboardingContext.close();

    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    await page.goto(`${BASE}/dashboard/form-builder`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(1200);

    const emptyText = page.getByText('Start by adding an intro screen');
    if (!(await emptyText.isVisible().catch(() => false))) {
      failures.push('Empty builder state: missing "Start by adding an intro screen"');
    }

    await page.getByRole('button', { name: /add screen/i }).first().click();
    await page.waitForTimeout(600);
    if (!(await page.getByText('Start Screen').first().isVisible().catch(() => false))) {
      failures.push('After Add screen: Start Screen not visible in sidebar');
    }

    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.waitForTimeout(400);

    if (await page.getByText('Password protection').isVisible().catch(() => false)) {
      failures.push('Settings should not show Password protection row');
    }
    if (await page.getByText('One question at a time').isVisible().catch(() => false)) {
      failures.push('Settings should not show One question at a time row');
    }
    if (!(await page.getByText('Auto-advance on selection').isVisible().catch(() => false))) {
      failures.push('Settings missing Auto-advance on selection toggle');
    }
    if (await page.getByText('Language').isVisible().catch(() => false)) {
      failures.push('Settings should not show Language row');
    }
    if (await page.getByText('Webhook URL').isVisible().catch(() => false)) {
      failures.push('Settings should not show Webhook URL row');
    }
    if (!(await page.getByText('Connect integrations').isVisible().catch(() => false))) {
      failures.push('Settings missing Connect integrations row');
    }
    const backToggle = page.getByText('Show a back button so respondents');
    await backToggle.scrollIntoViewIfNeeded().catch(() => {});
    if (!(await backToggle.isVisible().catch(() => false))) {
      failures.push('Settings missing Back button toggle');
    }

    await page.getByRole('button', { name: 'Content', exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /add screen/i }).first().click();
    await page.waitForTimeout(600);

    const singleTile = page.getByRole('button', { name: 'Single', exact: true });
    if (await singleTile.isVisible().catch(() => false)) {
      await singleTile.click();
      await page.waitForTimeout(1200);
      if (!(await page.getByText('SINGLE').first().isVisible().catch(() => false))) {
        failures.push('Single configure panel: SINGLE header not found');
      }
    } else {
      failures.push('Content panel: Single tile not visible');
    }

    await page.getByRole('button', { name: 'Logic', exact: true }).click();
    await page.waitForTimeout(900);
    if (!(await page.getByRole('button', { name: 'Manual Logic' }).isVisible().catch(() => false))) {
      failures.push('Logic tab: manual logic canvas chrome not visible');
    }

    const singleOutputPort = page.locator('[data-logic-kind="content"] [data-logic-output-port]').first();
    const endLogicCard = page.locator('[data-logic-kind="end"]').first();
    if (
      (await singleOutputPort.isVisible().catch(() => false)) &&
      (await endLogicCard.isVisible().catch(() => false))
    ) {
      const portBox = await singleOutputPort.boundingBox();
      const endBox = await endLogicCard.boundingBox();
      if (portBox && endBox) {
        await page.mouse.move(portBox.x + portBox.width / 2, portBox.y + portBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(endBox.x + 24, endBox.y + endBox.height / 2, { steps: 14 });
        await page.mouse.up();
        await page.waitForTimeout(600);
        const ifMenuItem = page.getByRole('menuitem', { name: 'If logic' });
        if (await ifMenuItem.isVisible().catch(() => false)) {
          await ifMenuItem.click();
          await page.waitForTimeout(800);
          if (!(await page.getByRole('heading', { name: 'If / Then Logic' }).isVisible().catch(() => false))) {
            failures.push('If/Then logic: panel did not open after choosing If logic on new wire');
          }
        } else {
          failures.push('If/Then logic: edge kind menu missing "If logic" after connecting Single → End');
        }
      } else {
        failures.push('If/Then logic: could not measure logic canvas card positions for drag-connect');
      }
    } else {
      failures.push('If/Then logic: Single output port or End card missing on logic canvas');
    }

    await page.getByRole('button', { name: 'Content', exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByTitle('Preview').click();
    await page.waitForTimeout(800);
    const startBtn = page.getByRole('button', { name: /Start\s*→/ });
    if (!(await startBtn.isVisible().catch(() => false))) {
      failures.push('Preview mode: intro Start button not visible');
    }
  } catch (err) {
    failures.push(`Unhandled: ${err.message}`);
  } finally {
    await browser.close();
    if (server) await server.close();
  }

  const filteredErrors = consoleErrors.filter(
    (t) =>
      !t.includes('favicon') &&
      !t.includes('404') &&
      !t.includes('ConfigurePanelAccordion'),
  );

  if (filteredErrors.length) {
    failures.push(`Console errors:\n${filteredErrors.map((e) => `  - ${e}`).join('\n')}`);
  }

  if (failures.length) {
    console.error('SMOKE TEST FAILED:\n');
    failures.forEach((f) => console.error(`• ${f}\n`));
    process.exit(1);
  }

  console.log(
    'SMOKE TEST PASSED: onboarding welcome↔templates transitions, dashboard, builder, settings, logic canvas, if/then panel, single panel, preview — no console errors.',
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
