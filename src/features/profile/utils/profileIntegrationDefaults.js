export const DEFAULT_INTEGRATIONS = {
  webhook: { connected: false },
  googleSheets: { connected: true },
  googleDrive: { connected: false },
  slack: { connected: true },
  notion: { connected: false },
};

const INTEGRATION_KEYS = ['webhook', 'googleSheets', 'googleDrive', 'slack', 'notion'];

export function cloneIntegrations(integrations) {
  return INTEGRATION_KEYS.reduce((acc, key) => {
    acc[key] = { ...integrations[key] };
    return acc;
  }, {});
}

export function mergeIntegrations(saved) {
  const base = cloneIntegrations(DEFAULT_INTEGRATIONS);
  if (!saved || typeof saved !== 'object') return base;
  INTEGRATION_KEYS.forEach((key) => {
    if (typeof saved[key]?.connected === 'boolean') {
      base[key].connected = saved[key].connected;
    }
  });
  return base;
}
