/** AI-driven logic generation lifecycle (future API integration). */

import {
  applyAiLogicPayload,
  buildLocalAiLogicSuggestion,
} from '@/features/forms/utils/applyAiLogicResult';

export const AI_LOGIC_GEN_STATUS = {
  idle: 'idle',
  generating: 'generating',
  success: 'success',
  failed: 'failed',
};

const DEFAULT_FAILURE_MESSAGE = 'AI logic generation failed — please retry.';

const RATE_LIMIT_MESSAGE =
  "You've reached your plan's AI logic limit for now. Upgrade to Pilot for a higher limit, or retry later.";

/** HTTP statuses meaning the plan/rate limit blocked the call (not a server fault). */
const LIMIT_STATUSES = new Set([402, 403, 429]);

/** Simulated latency for stub generation (ms). */
const STUB_GENERATION_DELAY_MS = 700;

/**
 * Mark AI logic generation as failed so the error banner + panel are shown.
 * Call from the future API handler on non-2xx / network errors.
 *
 * @param {(patch: { status: string, errorMessage?: string }) => void} setAiLogicGen
 * @param {{ message?: string }} [options]
 */
export function markAiLogicGenerationFailed(setAiLogicGen, options = {}) {
  setAiLogicGen({
    status: AI_LOGIC_GEN_STATUS.failed,
    errorMessage: options.message ?? DEFAULT_FAILURE_MESSAGE,
  });
}

/**
 * Reset AI logic generation state (e.g. when leaving AI mode).
 *
 * @param {(patch: { status: string, errorMessage?: string }) => void} setAiLogicGen
 */
export function resetAiLogicGeneration(setAiLogicGen) {
  setAiLogicGen({ status: AI_LOGIC_GEN_STATUS.idle, errorMessage: '' });
}

/**
 * Fetch AI logic from API when `fetchAiLogic` is provided; otherwise uses local stub.
 * On success, normalizes the payload and invokes `onApply` with manual-mode state shapes.
 *
 * @param {object} context - screens, contentScreens, question builders, etc.
 * @param {(patch: object) => void} setAiLogicGen
 * @param {(applied: { logicConnections: object[], logicIfRulesByEdge: object, screens?: object[], meta?: object }) => void} onApply
 * @param {{ fetchAiLogic?: (context: object) => Promise<object>, onLimitReached?: (err: Error) => void }} [options]
 */
export async function runAiLogicGeneration(context, setAiLogicGen, onApply, options = {}) {
  const { fetchAiLogic, onLimitReached } = options;

  try {
    let payload;
    if (typeof fetchAiLogic === 'function') {
      payload = await fetchAiLogic(context);
    } else {
      await new Promise((resolve) => setTimeout(resolve, STUB_GENERATION_DELAY_MS));
      payload = buildLocalAiLogicSuggestion(context);
    }

    if (!payload?.connections?.length) {
      markAiLogicGenerationFailed(setAiLogicGen, {
        message: 'AI could not suggest any logic for this form. Try manual logic or add more question screens.',
      });
      return;
    }

    const applied = applyAiLogicPayload(context, payload);
    if (payload.meta && typeof payload.meta === 'object') {
      applied.meta = payload.meta;
    }
    onApply?.(applied);
    setAiLogicGen({ status: AI_LOGIC_GEN_STATUS.success, errorMessage: '' });
    return applied;
  } catch (err) {
    if (LIMIT_STATUSES.has(err?.status)) {
      onLimitReached?.(err);
      const serverMessage =
        err?.body?.code === 'UPGRADE_REQUIRED' ? err.body.message : null;
      markAiLogicGenerationFailed(setAiLogicGen, {
        message: serverMessage ?? RATE_LIMIT_MESSAGE,
      });
      return;
    }
    const message =
      err?.message && typeof err.message === 'string'
        ? err.message
        : DEFAULT_FAILURE_MESSAGE;
    markAiLogicGenerationFailed(setAiLogicGen, { message });
  }
}

/**
 * Example API handler — wire `fetchAiLogic` to this when the backend is ready.
 *
 * @param {string} apiUrl
 * @param {object} context
 */
export async function fetchAiLogicFromApi(apiUrl, context) {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      screens: context.screens,
      contentScreens: context.contentScreens,
    }),
  });
  if (!response.ok) {
    const err = new Error(`Server error (API ${response.status}) — please retry.`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}
