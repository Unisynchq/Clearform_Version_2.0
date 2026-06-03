/**
 * Map builder snapshot.theme to respondent shell styles (preview parity).
 */
export function getRespondentThemeStyles(theme) {
  if (!theme || typeof theme !== 'object') {
    return {
      pageBg: '#f5f4f0',
      fullCanvas: false,
      cardColor: '#f7f6f4',
      cardImage: null,
      textColor: '#18181b',
      accentColor: '#18181b',
      typography: "'DM Sans', sans-serif",
    };
  }

  const bg = theme.background;
  let pageBg = '#f5f4f0';
  if (typeof bg === 'string') pageBg = bg;
  else if (bg?.type === 'color' && bg?.value) pageBg = bg.value;
  else if (bg?.type === 'gradient' && Array.isArray(bg?.stops)?.[0]) {
    pageBg = bg.stops[0];
  }

  return {
    pageBg,
    fullCanvas: Boolean(theme.fullCanvas ?? theme.layoutStyle === 'full'),
    cardColor: theme.cardColor ?? '#f7f6f4',
    cardImage: theme.cardImage ?? null,
    textColor: theme.textColor ?? '#18181b',
    accentColor: theme.accentColor ?? theme.textColor ?? '#18181b',
    typography: theme.typography?.fontFamily
      ? `'${theme.typography.fontFamily}', sans-serif`
      : "'DM Sans', sans-serif",
  };
}

export function respondentCardStyle({ fullCanvas, cardColor, cardImage }) {
  if (fullCanvas) return {};
  if (cardImage) {
    return {
      backgroundImage: `url(${cardImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: cardColor,
    };
  }
  return { backgroundColor: cardColor };
}
