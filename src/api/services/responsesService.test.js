import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  isApiConfigured: vi.fn(() => true),
  env: { apiBaseUrl: 'http://localhost:3000/api/v1' },
}));

vi.mock('@/store/store', () => ({
  store: { dispatch: vi.fn() },
}));

vi.mock('@/store/slices/formsSlice', () => ({
  addFormResponse: vi.fn(),
  loadFormsFromApi: vi.fn(),
}));

vi.mock('@/features/forms/utils/formResponsesStorage', () => ({
  appendFormResponse: vi.fn(),
}));

import { apiClient } from '@/api/client';
import { trackFormFunnelEvent } from '@/api/services/responsesService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('trackFormFunnelEvent', () => {
  it('posts an opened event with its sessionId', async () => {
    apiClient.mockResolvedValue({ status: 'accepted' });
    await trackFormFunnelEvent('form-1', 'opened', 'session-abc');
    expect(apiClient).toHaveBeenCalledWith('/forms/form-1/responses/events', {
      method: 'POST',
      body: { kind: 'opened', sessionId: 'session-abc' },
    });
  });

  it('swallows failures so the respondent flow never breaks', async () => {
    apiClient.mockRejectedValue(new Error('boom'));
    await expect(
      trackFormFunnelEvent('form-1', 'started', 'session-abc'),
    ).resolves.toBeNull();
  });

  it('skips the request when the API is not configured', async () => {
    const { isApiConfigured } = await import('@/config/env');
    isApiConfigured.mockReturnValueOnce(false);
    const result = await trackFormFunnelEvent('form-1', 'opened', 'session-abc');
    expect(result).toBeNull();
    expect(apiClient).not.toHaveBeenCalled();
  });
});
