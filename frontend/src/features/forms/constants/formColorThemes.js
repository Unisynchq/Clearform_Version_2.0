/** Theme tokens for new forms — matches Figma colour swatches (node 2686:3834). */
export const FORM_COLOR_OPTIONS = [
  {
    id: 'blue',
    value: '#3b7bf6',
    gradientFrom: '#ebf2fb',
    gradientTo: '#b5d4f4',
    overlayColor: 'rgba(29,95,173,',
    iconGradient: 'linear-gradient(140deg, #ebf2fb 0%, #b5d4f4 100%)',
  },
  {
    id: 'green',
    value: '#22c55e',
    gradientFrom: '#ebf5ee',
    gradientTo: '#9fe1cb',
    overlayColor: 'rgba(46,125,82,',
    iconGradient: 'linear-gradient(140deg, #ebf5ee 0%, #9fe1cb 100%)',
  },
  {
    id: 'amber',
    value: '#f59e0b',
    gradientFrom: '#fef6e8',
    gradientTo: '#f5d49a',
    overlayColor: 'rgba(160,96,10,',
    iconGradient: 'linear-gradient(140deg, #fef6e8 0%, #f5d49a 100%)',
  },
  {
    id: 'red',
    value: '#ef4444',
    gradientFrom: '#fef0f0',
    gradientTo: '#f5b4b4',
    overlayColor: 'rgba(190,18,60,',
    iconGradient: 'linear-gradient(140deg, #fef0f0 0%, #f5b4b4 100%)',
  },
];

export function getFormColorTheme(colorId) {
  return FORM_COLOR_OPTIONS.find((o) => o.id === colorId) ?? FORM_COLOR_OPTIONS[0];
}
