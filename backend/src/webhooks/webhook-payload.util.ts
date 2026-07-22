export type WebhookEventName = 'response.created' | 'form.published';

export interface ResponseCreatedWebhookPayload {
  event: 'response.created';
  formId: string;
  responseId: string;
  submittedAt: string;
  formTitle: string;
  answers: unknown;
  test?: boolean;
}

export interface FormPublishedWebhookPayload {
  event: 'form.published';
  formId: string;
  formTitle: string;
  publishedAt: string;
  test?: boolean;
}

export type WebhookPayload =
  | ResponseCreatedWebhookPayload
  | FormPublishedWebhookPayload;

export function buildResponseCreatedPayload(input: {
  formId: string;
  responseId: string;
  submittedAt: string;
  formTitle: string;
  answers: unknown;
  test?: boolean;
}): ResponseCreatedWebhookPayload {
  return {
    event: 'response.created',
    formId: input.formId,
    responseId: input.responseId,
    submittedAt: input.submittedAt,
    formTitle: input.formTitle,
    answers: input.answers,
    ...(input.test ? { test: true } : {}),
  };
}

export function buildFormPublishedPayload(input: {
  formId: string;
  formTitle: string;
  publishedAt: string;
  test?: boolean;
}): FormPublishedWebhookPayload {
  return {
    event: 'form.published',
    formId: input.formId,
    formTitle: input.formTitle,
    publishedAt: input.publishedAt,
    ...(input.test ? { test: true } : {}),
  };
}

/** Empty triggers = deliver all events; otherwise event must be listed. */
export function webhookMatchesTrigger(
  triggers: unknown,
  event: WebhookEventName,
): boolean {
  if (!Array.isArray(triggers) || triggers.length === 0) {
    return true;
  }
  return triggers.some((t) => typeof t === 'string' && t === event);
}
