/**
 * Builder draft / published snapshot shape shared by auto-save and publish.
 */
export function buildPublishSnapshot({
  formId,
  templateId = null,
  formTitle,
  screens,
  nextId,
  intro,
  end,
  logicConnections,
  logicIfRulesByEdge,
  logicMeta = null,
  theme,
  settings,
  savedAt = Date.now(),
}) {
  return {
    version: 1,
    formId,
    templateId,
    formTitle,
    screens,
    nextId,
    intro,
    end,
    logicConnections,
    logicIfRulesByEdge,
    logicMeta,
    theme,
    settings,
    savedAt,
  };
}

/** @param {{ logicModeManual?: boolean, logicCardOffsets?: object, aiLogicGenStatus?: string }} meta */
export function buildLogicMeta({ logicModeManual = true, logicCardOffsets = {}, aiLogicGenStatus = 'idle' }) {
  return {
    logicModeManual,
    logicCardOffsets,
    aiLogicGenStatus,
  };
}
