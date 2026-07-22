import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';

export function buildFallbackPublicUrl(formId) {
  if (typeof window !== 'undefined' && formId != null) {
    return `${window.location.origin}/f/${formId}`;
  }
  return formId != null ? `/f/${formId}` : '';
}

export async function fetchShareLinks(formId) {
  if (!isApiConfigured() || !formId) {
    return {
      formId,
      publicUrl: buildFallbackPublicUrl(formId),
      shortDisplay: formId ? `${typeof window !== 'undefined' ? window.location.host : ''}/f/${formId}` : '',
      slug: 'form',
      status: 'draft',
    };
  }
  return apiClient(API_ENDPOINTS.forms.shareLinks(formId));
}
