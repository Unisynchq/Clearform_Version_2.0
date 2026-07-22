/**
 * Normalizes public submit bodies from the handoff (top-level answersByScreenId)
 * and the API wrapper shape ({ data: { ... } }).
 */
export function normalizeCreateResponseBody(body: Record<string, unknown>): {
  payload: Record<string, unknown>;
  submittedAt: string;
} {
  const nested = body.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const data = nested as Record<string, unknown>;
    const submittedAt =
      typeof data.submittedAt === 'string'
        ? data.submittedAt
        : typeof body.submittedAt === 'string'
          ? body.submittedAt
          : new Date().toISOString();
    return { payload: data, submittedAt };
  }

  const submittedAt =
    typeof body.submittedAt === 'string'
      ? body.submittedAt
      : new Date().toISOString();

  const payload: Record<string, unknown> = { ...body };
  delete payload.data;

  return { payload, submittedAt };
}
