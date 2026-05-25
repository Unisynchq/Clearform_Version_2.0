export const DEFAULT_INTEGRATIONS = {
  webhook: { connected: true },
  googleSheets: { connected: false },
};

export function cloneIntegrations(integrations) {
  return {
    webhook: { ...integrations.webhook },
    googleSheets: { ...integrations.googleSheets },
  };
}

export function mergeIntegrations(saved) {
  const base = cloneIntegrations(DEFAULT_INTEGRATIONS);
  if (!saved || typeof saved !== 'object') return base;
  if (typeof saved.webhook?.connected === 'boolean') {
    base.webhook.connected = saved.webhook.connected;
  }
  if (typeof saved.googleSheets?.connected === 'boolean') {
    base.googleSheets.connected = saved.googleSheets.connected;
  }
  return base;
}
