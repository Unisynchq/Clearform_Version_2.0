import {
  buildLogicAnswersFromScreen,
  resolveVisibleNextScreenId,
} from '@/features/forms/utils/logicEngine';

/**
 * Shared navigation for builder preview and published respondent flows.
 */
export function createFormLogicRunner({
  screens = [],
  logicConnections = [],
  logicIfRulesByEdge = {},
  logicElseByScreen = {},
}) {
  const answersByScreenId = {};

  const recordScreenAnswers = (screenId, snap) => {
    const screen = screens.find((s) => s.id === screenId);
    if (!screen || !snap) return;
    answersByScreenId[screenId] = buildLogicAnswersFromScreen(screen, snap);
  };

  const getNextScreenId = (fromScreenId) =>
    resolveVisibleNextScreenId({
      fromScreenId,
      screens,
      logicIfRulesByEdge,
      logicElseByScreen,
      logicConnections,
      answersByScreenId,
    });

  return {
    answersByScreenId,
    recordScreenAnswers,
    getNextScreenId,
  };
}
