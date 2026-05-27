import {
  LuBriefcase,
  LuGraduationCap,
  LuCircleHelp,
  LuLayoutGrid,
  LuShieldCheck,
  LuGauge,
  LuFlaskConical,
  LuFileText,
  LuLightbulb,
} from 'react-icons/lu';

/**
 * Static template catalog — replace `fetchTemplates` in templatesApi.js
 * when a backend endpoint is available. Shape is stable for API mapping.
 *
 * @typedef {Object} TemplateCatalogItem
 * @property {string} id
 * @property {import('react').ComponentType<{size?:number,className?:string}>} Icon
 * @property {string} title
 * @property {string} description
 * @property {string} category - Display label on the card tag
 * @property {string} filter - Maps to TEMPLATE_FILTER_TABS (except "All")
 * @property {'light'|'muted'} tagVariant - Figma tag surface: white vs #f0efe9
 */

/** @type {TemplateCatalogItem[]} */
export const TEMPLATE_CATALOG = [
  {
    id: 'job-applications',
    Icon: LuBriefcase,
    title: 'Job Applications — High-Quality Roles',
    description:
      'Streamline your hiring process for competitive positions with structured evaluation criteria that ensure fairness and depth in candidate assessment.',
    category: 'HR & Recruitment',
    filter: 'HR & Recruitment',
    tagVariant: 'light',
  },
  {
    id: 'grant-scholarship',
    Icon: LuGraduationCap,
    title: 'Grant & Scholarship Applications',
    description:
      'Built for foundations, universities, and NGOs running competitive, high-value funding programs — where fairness and depth both matter.',
    category: 'Education & Funding',
    filter: 'Education',
    tagVariant: 'light',
  },
  {
    id: 'customer-support',
    Icon: LuCircleHelp,
    title: 'Customer Support — Complex & Technical Issues',
    description:
      'Capture detailed information about complex technical problems, enabling your support team to provide more effective solutions faster.',
    category: 'Support',
    filter: 'Support',
    tagVariant: 'light',
  },
  {
    id: 'consulting-intake',
    Icon: LuLayoutGrid,
    title: 'Consulting & Service Client Intake',
    description:
      'Professional client onboarding forms that gather comprehensive project requirements and expectations from the start.',
    category: 'Professional Services',
    filter: 'Legal',
    tagVariant: 'light',
  },
  {
    id: 'compliance-legal',
    Icon: LuShieldCheck,
    title: 'Compliance, Legal & Financial Submissions',
    description:
      'Secure and thorough forms for handling sensitive compliance, legal documentation, and financial information submissions.',
    category: 'Compliance',
    filter: 'Legal',
    tagVariant: 'muted',
  },
  {
    id: 'performance-reviews',
    Icon: LuGauge,
    title: 'Performance Reviews & Internal Evaluations',
    description:
      'Comprehensive employee performance review templates that encourage thoughtful feedback and meaningful professional development.',
    category: 'HR & Management',
    filter: 'HR & Recruitment',
    tagVariant: 'muted',
  },
  {
    id: 'research-incentives',
    Icon: LuFlaskConical,
    title: 'Research Studies with Incentives',
    description:
      'Perfect for academic researchers, UX teams, and market researchers who need high-quality qualitative responses — not just completed forms.',
    category: 'Research',
    filter: 'Research',
    tagVariant: 'muted',
  },
  {
    id: 'rfp-procurement',
    Icon: LuFileText,
    title: 'RFP & Vendor Submissions (Procurement)',
    description:
      'Structured request for proposal templates that help you collect detailed vendor responses and make informed procurement decisions.',
    category: 'Procurement',
    filter: 'Legal',
    tagVariant: 'muted',
  },
  {
    id: 'edtech-assessment',
    Icon: LuLightbulb,
    title: 'EdTech & Learning Assessment',
    description:
      'Designed for online learning platforms, bootcamps, and educators collecting reflective assignments — where the quality of thinking matters more than the volume of words.',
    category: 'Education',
    filter: 'Education',
    tagVariant: 'muted',
  },
];
