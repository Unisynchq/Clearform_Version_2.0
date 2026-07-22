import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';

// Mirrors the TEMPLATE_CATALOG shape from the frontend (no Icon field — that's React-specific).
// When VITE_API_BASE_URL is set the frontend will use this endpoint; the built-in catalog is the fallback.
const TEMPLATES = [
  {
    id: 'job-applications',
    title: 'Job Applications — High-Quality Roles',
    description:
      'Streamline your hiring process for competitive positions with structured evaluation criteria that ensure fairness and depth in candidate assessment.',
    category: 'HR & Recruitment',
    filter: 'HR & Recruitment',
    tagVariant: 'light',
  },
  {
    id: 'grant-scholarship',
    title: 'Grant & Scholarship Applications',
    description:
      'Built for foundations, universities, and NGOs running competitive, high-value funding programs — where fairness and depth both matter.',
    category: 'Education & Funding',
    filter: 'Education',
    tagVariant: 'light',
  },
  {
    id: 'customer-support',
    title: 'Customer Support — Complex & Technical Issues',
    description:
      'Capture detailed information about complex technical problems, enabling your support team to provide more effective solutions faster.',
    category: 'Support',
    filter: 'Support',
    tagVariant: 'light',
  },
  {
    id: 'consulting-intake',
    title: 'Consulting & Service Client Intake',
    description:
      'Professional client onboarding forms that gather comprehensive project requirements and expectations from the start.',
    category: 'Professional Services',
    filter: 'Legal',
    tagVariant: 'light',
  },
  {
    id: 'compliance-legal',
    title: 'Compliance, Legal & Financial Submissions',
    description:
      'Secure and thorough forms for handling sensitive compliance, legal documentation, and financial information submissions.',
    category: 'Compliance',
    filter: 'Legal',
    tagVariant: 'muted',
  },
  {
    id: 'performance-reviews',
    title: 'Performance Reviews & Internal Evaluations',
    description:
      'Comprehensive employee performance review templates that encourage thoughtful feedback and meaningful professional development.',
    category: 'HR & Management',
    filter: 'HR & Recruitment',
    tagVariant: 'muted',
  },
  {
    id: 'research-incentives',
    title: 'Research Studies with Incentives',
    description:
      'Perfect for academic researchers, UX teams, and market researchers who need high-quality qualitative responses — not just completed forms.',
    category: 'Research',
    filter: 'Research',
    tagVariant: 'muted',
  },
  {
    id: 'rfp-procurement',
    title: 'RFP & Vendor Submissions (Procurement)',
    description:
      'Structured request for proposal templates that help you collect detailed vendor responses and make informed procurement decisions.',
    category: 'Procurement',
    filter: 'Legal',
    tagVariant: 'muted',
  },
  {
    id: 'edtech-assessment',
    title: 'EdTech & Learning Assessment',
    description:
      'Designed for online learning platforms, bootcamps, and educators collecting reflective assignments — where the quality of thinking matters more than the volume of words.',
    category: 'Education',
    filter: 'Education',
    tagVariant: 'muted',
  },
];

@Controller('api/v1/templates')
export class TemplatesController {
  @Public()
  @Get()
  list() {
    return TEMPLATES;
  }
}
