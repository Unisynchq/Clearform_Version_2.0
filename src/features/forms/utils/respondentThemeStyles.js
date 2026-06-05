import { TYPOGRAPHY_FONTS, hexToRgba } from '@/features/forms/formBuilder/builderConfiguratorConstants';

const DEFAULTS = {
  pageBg: '#f5f4f0',
  fullCanvas: false,
  cardColor: '#f7f6f4',
  cardImage: null,
  textColor: '#18181b',
  accentColor: '#18181b',
  typography: TYPOGRAPHY_FONTS.default,
};

function resolvePageBackground(background) {
  if (!background) return DEFAULTS.pageBg;
  if (typeof background === 'string') return background;
  if (background?.type === 'color' && background?.value) return background.value;
  if (background?.type === 'gradient' && Array.isArray(background?.stops)?.[0]) {
    return background.stops[0];
  }
  return DEFAULTS.pageBg;
}

function resolveTypography(theme) {
  if (!theme?.typography) return DEFAULTS.typography;
  if (typeof theme.typography === 'string') {
    return TYPOGRAPHY_FONTS[theme.typography] ?? TYPOGRAPHY_FONTS.default;
  }
  if (theme.typography?.fontFamily) {
    return `'${theme.typography.fontFamily}', sans-serif`;
  }
  return DEFAULTS.typography;
}

/**
 * Map published snapshot.theme to the same tokens builder preview uses (resolveBuilderTheme).
 */
export function resolveThemeFromSnapshot(theme) {
  if (!theme || typeof theme !== 'object') {
    return { ...DEFAULTS, canvasBackground: DEFAULTS.pageBg };
  }

  const pageBg = resolvePageBackground(theme.background);
  const fullCanvas = Boolean(theme.fullCanvas ?? theme.layoutStyle === 'fullCanvas');
  const cardImage = theme.cardImage ?? null;
  const cardColorRaw = theme.cardColor ?? '#f9f9fa';
  const cardOpacity = typeof theme.cardOpacity === 'number' ? theme.cardOpacity : 74;
  const cardColor = cardImage ? cardColorRaw : hexToRgba(cardColorRaw, cardOpacity);
  const textColor = theme.textColor ?? DEFAULTS.textColor;
  const accentColor = theme.accentColor ?? textColor ?? DEFAULTS.accentColor;
  const typography = resolveTypography(theme);

  return {
    pageBg,
    canvasBackground: pageBg,
    fullCanvas,
    cardColor,
    cardImage,
    textColor,
    accentColor,
    typography,
  };
}

/** @deprecated use resolveThemeFromSnapshot */
export function getRespondentThemeStyles(theme) {
  return resolveThemeFromSnapshot(theme);
}

export function respondentCardStyle({ fullCanvas, cardColor, cardImage }) {
  return getCardShellSurface({ fullCanvas, cardColor, cardImage }).shellStyle;
}

/** Shared card shell surface — builder ContentCard + intro/end welcome screens. */
export function getCardShellSurface({
  fullCanvas = false,
  cardColor = '#f7f6f4',
  cardImage = null,
}) {
  if (fullCanvas) {
    return {
      borderAndRadius: '',
      shellStyle: {
        border: 'none',
        boxShadow: 'none',
        background: 'transparent',
        backgroundImage: 'none',
      },
    };
  }

  return {
    borderAndRadius: 'border border-[rgba(0,0,0,0.07)] rounded-[20px]',
    shellStyle: {
      ...(cardImage
        ? {
            backgroundImage: `url(${cardImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { backgroundColor: cardColor }),
      boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 8px 32px 0px rgba(0,0,0,0.07)',
    },
  };
}
