/**
 * Preview copy + blocks for user-saved templates (from builder snapshots).
 */

function countQuestions(screens = []) {
  return screens.filter(
    (s) =>
      s?.type === 'content' &&
      s.label !== 'Heading' &&
      s.label !== 'Captcha'
  ).length;
}

function estimateDuration(questionCount) {
  const minutes = Math.max(3, Math.round(questionCount * 1.2));
  return `~${minutes} min`;
}

/** Card mini-preview for TemplateCard */
export function getUserTemplateCardPreview(snapshot) {
  const screens = snapshot?.screens ?? [];
  const intro = snapshot?.intro ?? {};
  const heading = screens.find((s) => s.label === 'Heading');
  const questionCount = countQuestions(screens);

  return {
    sectionLabel: 'SECTION HEADING',
    title:
      heading?.config?.headingText ??
      heading?.previewText ??
      intro.title ??
      snapshot?.formTitle ??
      'Your template',
    description:
      heading?.config?.subHeading ??
      intro.description ??
      'Saved from your workspace for quick reuse.',
    formMeta: `${estimateDuration(questionCount)} form · ${questionCount} Questions`,
  };
}

/** Preview modal blocks + meta */
export function getUserTemplatePreviewBlocks(snapshot) {
  const screens = snapshot?.screens ?? [];
  const intro = snapshot?.intro ?? {};
  const questionCount = countQuestions(screens);

  const blocks = [
    {
      type: 'welcome',
      label: 'Welcome screen',
      title: intro.title ?? snapshot?.formTitle ?? 'Welcome',
      description: intro.description ?? null,
    },
  ];

  let questionNum = 0;
  for (const screen of screens) {
    if (screen.type !== 'content') continue;
    if (screen.label === 'Heading') {
      blocks.push({
        type: 'section',
        label: 'Section heading',
        title: screen.config?.headingText ?? screen.previewText ?? 'Section',
        description: screen.config?.subHeading ?? null,
      });
      continue;
    }
    if (screen.label === 'Captcha') continue;

    questionNum += 1;
    blocks.push({
      type: 'question',
      num: questionNum,
      label: screen.label ?? 'Question',
      title: screen.previewText ?? screen.name ?? 'Question',
      description: null,
      fields: [],
    });
  }

  return {
    blocks,
    meta: {
      questionCount,
      duration: estimateDuration(questionCount),
      structure: blocks.some((b) => b.type === 'section') ? 'Multi-section' : 'Single flow',
    },
  };
}
