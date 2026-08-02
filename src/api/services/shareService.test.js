import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildEmbedCode } from '@/features/forms/utils/embedCode';

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  isApiConfigured: () => true,
}));

import { apiClient } from '@/api/client';
import { fetchShareLinks, buildFallbackPublicUrl } from '@/api/services/shareService';

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'https://app.clearform.in',
      protocol: 'https:',
      host: 'app.clearform.in',
      hostname: 'app.clearform.in',
      pathname: '/',
    },
    configurable: true,
  });
});

describe('fetchShareLinks embed pipeline', () => {
  it('upgrades a backend http:// publicUrl to https for the embed', async () => {
    apiClient.mockResolvedValue({
      formId: 42,
      publicUrl: 'http://app.clearform.in/f/abc',
      shortDisplay: 'app.clearform.in/f/abc',
      status: 'live',
    });
    const links = await fetchShareLinks(42);
    expect(links.publicUrl).toBe('https://app.clearform.in/f/abc');
    expect(buildEmbedCode(links.publicUrl)).toContain(
      'src="https://app.clearform.in/f/abc"',
    );
  });

  it('resolves a relative backend publicUrl to the app origin', async () => {
    apiClient.mockResolvedValue({
      formId: 42,
      publicUrl: '/f/abc',
      shortDisplay: 'app.clearform.in/f/abc',
      status: 'live',
    });
    const links = await fetchShareLinks(42);
    expect(links.publicUrl).toBe('https://app.clearform.in/f/abc');
  });

  it('keeps localhost dev URLs http', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        pathname: '/',
      },
      configurable: true,
    });
    apiClient.mockResolvedValue({
      formId: 42,
      publicUrl: 'http://localhost:3000/f/abc',
      shortDisplay: 'localhost:3000/f/abc',
      status: 'live',
    });
    const links = await fetchShareLinks(42);
    expect(links.publicUrl).toBe('http://localhost:3000/f/abc');
  });

  it('falls back to the app origin when no API is configured', () => {
    expect(buildFallbackPublicUrl(7)).toBe('https://app.clearform.in/f/7');
  });
});
