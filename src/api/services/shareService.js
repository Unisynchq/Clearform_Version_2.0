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
  const data = await apiClient(API_ENDPOINTS.forms.shareLinks(formId));
  if (data && data.publicUrl && typeof window !== 'undefined') {
    try {
      const url = new URL(data.publicUrl);
      url.protocol = window.location.protocol;
      url.host = window.location.host;
      data.publicUrl = url.toString();
      data.shortDisplay = `${window.location.host}${url.pathname}`;
    } catch (e) {
      // fallback
    }
  }
  return data;
}
