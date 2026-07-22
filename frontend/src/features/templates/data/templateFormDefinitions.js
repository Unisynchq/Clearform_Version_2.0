import { DEFAULT_CONTACT_FIELDS } from '@/features/forms/utils/screenConfigSync';

/** @typedef {{ section: string, label: string, previewText?: string, config?: object }} TemplateCardDef */

/**
 * @typedef {Object} TemplateFormDefinition
 * @property {string} id
 * @property {string} formTitle
 * @property {{ title: string, description: string, buttonText: string, duration?: string }} intro
 * @property {{ title: string, description: string, buttonText: string }} [end]
 * @property {TemplateCardDef[]} cards
 */

const shortText = (question, helper, placeholder = 'Type your answer here…') => ({
  section: 'qualitative',
  label: 'Short text',
  previewText: question,
  config: {
    shortTextQuestion: question,
    shortTextHelperText: helper,
    shortTextPlaceholder: placeholder,
    shortTextMaxChars: 500,
    shortTextMinChars: 0,
    shortTextRequired: true,
    shortTextHidden: false,
  },
});

const longText = (question, helper, placeholder = 'Type your answer here…') => ({
  section: 'qualitative',
  label: 'Long text',
  previewText: question,
  config: {
    longTextQuestion: question,
    longTextHelperText: helper,
    longTextPlaceholder: placeholder,
    longTextMaxChars: 5000,
    longTextMinChars: 0,
    longTextRequired: true,
    longTextHidden: false,
  },
});

const heading = (title, body) => ({
  section: 'buildingBlocks',
  label: 'Heading',
  previewText: title,
  config: {
    headingText: title,
    subHeading: body,
    headingRequired: false,
    headingHidden: false,
  },
});

const contact = (question, helper) => ({
  section: 'basicInfo',
  label: 'Contact',
  previewText: question,
  config: {
    contactQuestion: question,
    contactHelperText: helper,
    contactFields: DEFAULT_CONTACT_FIELDS,
    contactRequired: true,
  },
});

const single = (question, helper, options) => ({
  section: 'choiceBased',
  label: 'Single',
  previewText: question,
  config: {
    singleQuestion: question,
    singleHelperText: helper,
    singleOptions: options,
    singleRequired: true,
    singleAllowOther: true,
    singleRandomize: false,
  },
});

const multiple = (question, helper, options) => ({
  section: 'choiceBased',
  label: 'Multiple',
  previewText: question,
  config: {
    multipleQuestion: question,
    multipleHelperText: helper,
    multipleOptions: options,
    multipleRequired: true,
    multipleAllowOther: false,
    multipleRandomize: false,
  },
});

const rating = (question, low = 'Not confident', high = 'Very confident') => ({
  section: 'numeric',
  label: 'Rating',
  previewText: question,
  config: {
    ratingQuestion: question,
    ratingRequired: true,
    ratingUseScale: true,
    ratingMaxRating: 5,
    ratingStyle: 'Stars',
    ratingLowLabel: low,
    ratingHighLabel: high,
    ratingShowLabels: true,
  },
});

const upload = (question, helper) => ({
  section: 'interactive',
  label: 'Upload',
  previewText: question,
  config: { uploadQuestion: question, uploadHelperText: helper },
});

const multiUpload = (question, helper) => ({
  section: 'interactive',
  label: 'Multi-image upload',
  previewText: question,
  config: {
    question,
    helperText: helper,
    maxFiles: 5,
    required: true,
    multipleFiles: true,
  },
});

const captcha = () => ({
  section: 'interactive',
  label: 'Captcha',
  previewText: "Verify you're human",
  config: {
    captchaProvider: 'recaptcha',
    captchaEnabled: true,
    captchaVisibility: 'visible',
  },
});

const workInfo = (question, helper) => ({
  section: 'basicInfo',
  label: 'Work Info',
  previewText: question,
  config: {
    workQuestion: question,
    workHelperText: helper,
    workFields: {
      company: { visible: true, required: true },
      title: { visible: true, required: true },
      industry: { visible: false, required: false },
      teamSize: { visible: false, required: false },
    },
    workRequired: true,
  },
});

const media = (question, helper, options) => ({
  section: 'choiceBased',
  label: 'Media',
  previewText: question,
  config: {
    mediaQuestion: question,
    mediaHelperText: helper,
    mediaOptions: options.map((o) =>
      typeof o === 'string' ? { label: o, image: null } : { label: o.label, image: o.image ?? null }
    ),
    mediaRequired: true,
    mediaAllowMultiple: false,
  },
});

const dateCard = (question, helper = 'Pick a date from the calendar.') => ({
  section: 'numeric',
  label: 'Date',
  previewText: question,
  config: { dateQuestion: question, dateHelperText: helper, dateRequired: true },
});

/** @type {Record<string, TemplateFormDefinition>} */
export const TEMPLATE_FORM_DEFINITIONS = {
  'job-applications': {
    id: 'job-applications',
    formTitle: 'Job Applications — High-Quality Roles',
    intro: {
      title: 'Apply for your next role',
      description:
        'This application is designed for competitive, high-quality positions. Please answer thoughtfully — we review every submission carefully.',
      buttonText: 'Start application →',
      duration: 'Takes ~12 minutes',
    },
    cards: [
      heading(
        'Tell us about yourself',
        'This section covers your professional background and career goals. All information is kept confidential and used solely for recruitment purposes.'
      ),
      contact('How can we reach you?', "We'll only get in touch about your application status."),
      shortText(
        'What position are you applying for?',
        'Enter the exact job title from the listing.'
      ),
      shortText('How many years of relevant experience do you have?', 'Include only directly related roles.'),
      longText(
        'Describe your most significant professional achievement',
        'Focus on measurable impact and your specific contribution.'
      ),
      single('What work arrangement are you seeking?', 'Select the option that best fits your situation.', [
        'Full-time on-site',
        'Full-time remote',
        'Hybrid',
        'Contract / freelance',
      ]),
      multiple('Which skills are you strongest in?', 'Select all that apply.', [
        'Leadership',
        'Technical',
        'Communication',
        'Strategy',
        'Analytics',
        'Design',
      ]),
      rating('How confident are you in this role?', 'Not confident', 'Very confident'),
      multiUpload('Upload your CV / résumé', 'PDF preferred. Max 10 MB.'),
      longText('Cover letter (optional)', 'Tell us why you are a great fit for this role.'),
      captcha(),
    ],
  },

  'grant-scholarship': {
    id: 'grant-scholarship',
    formTitle: 'Grant & Scholarship Applications',
    intro: {
      title: 'Grant & scholarship application',
      description:
        'Complete this form to apply for funding. All responses are reviewed by our panel — quality and clarity matter more than length.',
      buttonText: 'Begin application →',
      duration: 'Takes ~15 minutes',
    },
    cards: [
      heading(
        'Project overview',
        'Provide a clear summary of your proposed project or research.'
      ),
      shortText('Project title', 'Use the official title of your proposal.'),
      single('Application category', 'Select the category that best describes your project.', [
        'Research grant',
        'Scholarship',
        'Community project',
        'Innovation fund',
      ]),
      longText('Problem statement', 'What problem does your project address?'),
      longText('Proposed solution', 'How will your project solve this problem?'),
      dateCard('Project start date'),
      shortText('Total budget requested', 'Enter amount in your local currency.'),
      multiUpload('Upload budget breakdown', 'Spreadsheet or PDF outlining costs.'),
      multiple('Have you received prior funding for this project?', 'Select all that apply.', [
        'No prior funding',
        'University grant',
        'Government grant',
        'Private foundation',
      ]),
      longText('Expected impact', 'Who benefits and how?'),
      captcha(),
    ],
  },

  'customer-support': {
    id: 'customer-support',
    formTitle: 'Customer Support — Complex & Technical Issues',
    intro: {
      title: 'Technical support request',
      description:
        'Help us resolve your issue faster by providing detailed information. The more context you share, the quicker we can assist.',
      buttonText: 'Report issue →',
      duration: 'Takes ~8 minutes',
    },
    cards: [
      contact('Your contact details', "We'll use this to follow up on your ticket."),
      single('What type of issue are you experiencing?', 'Choose the closest match.', [
        'Bug / error',
        'Performance',
        'Integration',
        'Account access',
        'Billing',
      ]),
      single('How severe is the impact?', 'This helps us prioritize your request.', [
        'Critical — service down',
        'High — major feature broken',
        'Medium — workaround available',
        'Low — minor inconvenience',
      ]),
      longText('Steps to reproduce the issue', 'List each step clearly.'),
      longText('Exact error message (if any)', 'Copy and paste the full error text.'),
      dateCard('When did the issue first occur?'),
      multiple('Which environment are you using?', 'Select all that apply.', [
        'Web browser',
        'iOS app',
        'Android app',
        'API / integration',
        'Desktop app',
      ]),
      multiUpload('Screenshots or logs', 'Attach any relevant files.'),
      rating('How urgent is a resolution?', 'Can wait', 'Urgent'),
      shortText('Anything else we should know?', 'Optional additional context.'),
    ],
  },

  'consulting-intake': {
    id: 'consulting-intake',
    formTitle: 'Consulting & Service Client Intake',
    intro: {
      title: 'Client intake form',
      description:
        'Tell us about your business needs so we can prepare a tailored proposal for your engagement.',
      buttonText: 'Get started →',
      duration: 'Takes ~10 minutes',
    },
    cards: [
      workInfo('About your organization', 'Help us understand your company and role.'),
      single('What type of service are you looking for?', 'Select one.', [
        'Strategy consulting',
        'Implementation',
        'Audit & assessment',
        'Ongoing retainer',
      ]),
      shortText('Describe your goal in one sentence', 'Be as specific as possible.'),
      longText('Background & context', 'What led you to seek help now?'),
      media('Preferred engagement format', 'Select one option.', [
        { label: 'Workshop' },
        { label: 'Project-based' },
        { label: 'Retainer' },
        { label: 'Advisory' },
      ]),
      single('Estimated budget range', 'Select the range that fits best.', [
        'Under $10k',
        '$10k – $50k',
        '$50k – $100k',
        '$100k+',
      ]),
      single('When would you like to start?', 'Select your preferred timeline.', [
        'Immediately',
        'Within 1 month',
        '1–3 months',
        'Just exploring',
      ]),
      longText('What does success look like?', 'Define outcomes you want to achieve.'),
      multiple('Who is the decision maker?', 'Select all that apply.', [
        'Myself',
        'Executive team',
        'Board',
        'Procurement',
      ]),
      shortText('How did you hear about us?', 'Optional — helps us improve outreach.'),
    ],
  },

  'compliance-legal': {
    id: 'compliance-legal',
    formTitle: 'Compliance, Legal & Financial Submissions',
    intro: {
      title: 'Compliance submission',
      description:
        'Use this secure form to submit compliance, legal, or financial documentation. All data is encrypted in transit and at rest.',
      buttonText: 'Start submission →',
      duration: 'Takes ~12 minutes',
    },
    cards: [
      heading(
        'Submission details',
        'Complete all required fields. Incomplete submissions may be returned for revision.'
      ),
      contact('Submitter contact information', 'Primary point of contact for this submission.'),
      single('Submission type', 'Select the document type you are submitting.', [
        'Regulatory filing',
        'Legal disclosure',
        'Financial report',
        'Policy attestation',
      ]),
      dateCard('Reporting period end date'),
      longText('Executive summary', 'Provide a brief overview of this submission.'),
      multiple('Applicable frameworks', 'Select all that apply.', [
        'GDPR',
        'SOC 2',
        'ISO 27001',
        'HIPAA',
        'PCI DSS',
      ]),
      shortText('Reference / tracking number', 'If you have an existing case number.'),
      multiUpload('Primary document', 'Upload the main submission file.'),
      multiUpload('Supporting evidence', 'Optional supplementary files.'),
      shortText('Authorized signatory name', 'Full legal name of the signatory.'),
      captcha(),
    ],
  },

  'performance-reviews': {
    id: 'performance-reviews',
    formTitle: 'Performance Reviews & Internal Evaluations',
    intro: {
      title: 'Performance review',
      description:
        'Thoughtful, specific feedback helps everyone grow. Please complete all sections honestly and constructively.',
      buttonText: 'Begin review →',
      duration: 'Takes ~20 minutes',
    },
    cards: [
      workInfo('Employee information', 'Details about the person being reviewed.'),
      single('Review period', 'Select the applicable period.', [
        'Q1',
        'Q2',
        'Q3',
        'Q4',
        'Annual',
      ]),
      rating('Overall performance rating', 'Below expectations', 'Exceeds expectations'),
      longText('Key accomplishments', 'What did this person achieve during the review period?'),
      longText('Areas for improvement', 'Where could they grow?'),
      single('Recommendation', 'Select one.', [
        'Exceeds expectations — promote',
        'Meets expectations',
        'Needs improvement plan',
        'Does not meet expectations',
      ]),
      longText('Manager comments', 'Additional context for HR.'),
    ],
  },

  'research-incentives': {
    id: 'research-incentives',
    formTitle: 'Research Studies with Incentives',
    intro: {
      title: 'Research study participation',
      description:
        'Thank you for contributing to our research. Your responses are confidential and help us improve products and services.',
      buttonText: 'Participate →',
      duration: 'Takes ~10 minutes',
    },
    cards: [
      contact('Contact information (for incentive delivery)', 'We will only use this to send your reward.'),
      single('How did you hear about this study?', 'Select one.', [
        'Email invitation',
        'Social media',
        'In-app prompt',
        'Referral',
      ]),
      longText('Describe your experience in detail', 'Be as specific as possible — quality matters more than length.'),
      rating('How satisfied were you overall?', 'Very dissatisfied', 'Very satisfied'),
      single('Would you participate again?', 'Select one.', ['Yes', 'Maybe', 'No']),
      shortText('Any topics we should explore further?', 'Optional.'),
    ],
  },

  'rfp-procurement': {
    id: 'rfp-procurement',
    formTitle: 'RFP & Vendor Submissions (Procurement)',
    intro: {
      title: 'Vendor proposal submission',
      description:
        'Submit your response to our request for proposal. Ensure all required sections are completed before the deadline.',
      buttonText: 'Submit proposal →',
      duration: 'Takes ~25 minutes',
    },
    cards: [
      workInfo('Vendor company details', 'Legal entity submitting this proposal.'),
      shortText('Proposal reference number', 'Your internal tracking ID.'),
      longText('Executive summary', 'Summarize your proposal in 2–3 paragraphs.'),
      longText('Technical approach', 'Describe how you will deliver the scope.'),
      shortText('Total proposed cost', 'Include currency.'),
      multiUpload('Pricing breakdown', 'Itemized cost document.'),
      longText('Relevant case studies', 'Describe 2–3 similar engagements.'),
      single('Proposed contract term', 'Select one.', ['1 year', '2 years', '3 years', 'Flexible']),
      captcha(),
    ],
  },

  'edtech-assessment': {
    id: 'edtech-assessment',
    formTitle: 'EdTech & Learning Assessment',
    intro: {
      title: 'Learning assessment',
      description:
        'Demonstrate your understanding through reflective responses. There are no trick questions — we value depth of thinking.',
      buttonText: 'Start assessment →',
      duration: 'Takes ~15 minutes',
    },
    cards: [
      contact('Student information', 'So we can associate your submission with your enrollment.'),
      shortText('Course or module name', 'Enter the exact course title.'),
      longText(
        'Reflect on a concept you found challenging',
        'Explain what was difficult and how you worked through it.'
      ),
      longText(
        'Apply what you learned to a real scenario',
        'Describe a situation where you used this knowledge.'
      ),
      rating('Confidence in applying this material', 'Not confident', 'Very confident'),
      longText('What would you like to learn next?', 'Optional — helps us improve the curriculum.'),
    ],
  },
};

export function getTemplateFormDefinition(templateId) {
  return TEMPLATE_FORM_DEFINITIONS[templateId] ?? null;
}
