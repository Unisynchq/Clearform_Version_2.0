import { FORM_COLOR_OPTIONS, getFormColorTheme } from '@/features/forms/constants/formColorThemes';

export const buildFormFromTemplate = (template) => {
  const theme = getFormColorTheme(FORM_COLOR_OPTIONS[0].id);
  return {
    id: Date.now(),
    title: template.title,
    status: 'draft',
    responses: 0,
    timeAgo: 'just now',
    workspace: 'product',
    gradientFrom: theme.gradientFrom,
    gradientTo: theme.gradientTo,
    overlayColor: theme.overlayColor,
    iconGradient: theme.iconGradient,
    templateId: template.id,
  };
};

export const buildBlankOnboardingForm = (title = 'Untitled') => {
  const theme = getFormColorTheme(FORM_COLOR_OPTIONS[0].id);
  return {
    id: Date.now(),
    title,
    status: 'draft',
    responses: 0,
    timeAgo: 'just now',
    workspace: 'product',
    gradientFrom: theme.gradientFrom,
    gradientTo: theme.gradientTo,
    overlayColor: theme.overlayColor,
    iconGradient: theme.iconGradient,
  };
};
