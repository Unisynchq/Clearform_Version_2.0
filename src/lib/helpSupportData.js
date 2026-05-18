const FAQ_ITEMS = [
  {
    id: 'share',
    question: 'How do I share a form with respondents?',
    answer:
      'Open your form, click the Share button in the top right, and copy the link. You can also embed the form on any website using the embed code provided.',
  },
  {
    id: 'responses',
    question: 'Where can I see my form responses?',
    answer:
      'Click on any form from your dashboard, then go to the Responses tab. From there you can view, filter, and export all submissions.',
  },
  {
    id: 'logic',
    question: 'Can I add logic to show or hide fields?',
    answer:
      'Yes. Select any field in the form builder and open the Logic panel. You can set conditions to show, hide, or require fields based on previous answers.',
  },
  {
    id: 'invite',
    question: 'How do I invite teammates to a workspace?',
    answer:
      "Go to your workspace settings by clicking the workspace name in the sidebar. Under Members, enter your teammate's email address and choose their permission level.",
  },
  {
    id: 'export',
    question: 'Can I export responses to a spreadsheet?',
    answer:
      'Yes. In the Responses tab, click Export and choose CSV or connect to Google Sheets for a live sync that updates automatically with each new response.',
  },
  {
    id: 'deadline',
    question: 'How do I set a form to close after a deadline?',
    answer:
      'In the form settings, scroll to Scheduling. You can set a close date and time, or set a maximum number of responses after which the form closes automatically.',
  },
];

export const HELP_CONTACT = {
  generalEmail: 'hello@clearform.in',
  founderEmail: 'abbubakar@clearform.in',
  founderLinkedIn: 'https://www.linkedin.com/in/abbubakarr',
};

const LOAD_MS_DEFAULT = 720;
const LOAD_MS_SLOW = 2200;

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

/**
 * Mock fetch for Help & Support content.
 * Query params: ?help=fail | ?help=empty | ?help=slow
 */
export async function fetchHelpSupportContent(signal, searchParams) {
  const mode = searchParams?.get('help');
  const ms = mode === 'slow' ? LOAD_MS_SLOW : LOAD_MS_DEFAULT;

  await delay(ms, signal);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  if (mode === 'fail') {
    throw new Error('Failed to load help content');
  }

  const faqItems = mode === 'empty' ? [] : FAQ_ITEMS;

  return {
    faqItems,
    contact: HELP_CONTACT,
  };
}
