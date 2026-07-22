import { getScreenPreviewText } from '@/features/forms/utils/screenConfigSync';
import { formatScreenAnswerValue } from '@/features/forms/utils/formResponseBuilder';

/**
 * Build prior Q&A turns for response-quality eval (max 8 prior content screens).
 * Each turn: user answer only (question context is sent separately on the backend).
 */
export function buildQualityConversationHistory({
  screens,
  snapsByScreenId,
  currentScreenId,
  maxTurns = 8,
}) {
  if (!Array.isArray(screens) || !snapsByScreenId) return [];

  const contentScreens = screens.filter((s) => s.type === 'content' && s.id != null);
  const currentIdx = contentScreens.findIndex((s) => s.id === currentScreenId);
  const prior =
    currentIdx > 0 ? contentScreens.slice(0, currentIdx) : contentScreens.filter((s) => s.id !== currentScreenId);

  const history = [];
  for (const screen of prior.slice(-maxTurns)) {
    const snap = snapsByScreenId[screen.id] ?? snapsByScreenId[String(screen.id)];
    if (!snap) continue;
    const answer = formatScreenAnswerValue(screen, snap);
    if (!answer || answer === '—') continue;
    const question = getScreenPreviewText(screen);
    if (!question?.trim()) continue;
    history.push({ role: 'ai', content: question.trim() });
    history.push({ role: 'user', content: answer });
  }
  return history;
}
