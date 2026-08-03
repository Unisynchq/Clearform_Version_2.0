import { describe, it, expect, beforeEach } from 'vitest';
import * as sessionStorageSafe from './sessionStorageSafe';

describe('sessionStorageSafe', () => {
  beforeEach(() => {
    sessionStorageSafe.clear();
  });

  it('reads, writes, and removes items normally', () => {
    sessionStorageSafe.setItem('test_key', 'hello');
    expect(sessionStorageSafe.getItem('test_key')).toBe('hello');

    sessionStorageSafe.removeItem('test_key');
    expect(sessionStorageSafe.getItem('test_key')).toBeNull();
  });

  it('handles SecurityError gracefully when sessionStorage is restricted', () => {
    const originalSetItem = window.sessionStorage.setItem;
    const originalGetItem = window.sessionStorage.getItem;
    const originalRemoveItem = window.sessionStorage.removeItem;

    window.sessionStorage.setItem = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    window.sessionStorage.getItem = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    window.sessionStorage.removeItem = () => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    };

    expect(() => {
      sessionStorageSafe.setItem('insecure_key', 'fallback_value');
    }).not.toThrow();

    expect(sessionStorageSafe.getItem('insecure_key')).toBe('fallback_value');

    expect(() => {
      sessionStorageSafe.removeItem('insecure_key');
    }).not.toThrow();

    window.sessionStorage.setItem = originalSetItem;
    window.sessionStorage.getItem = originalGetItem;
    window.sessionStorage.removeItem = originalRemoveItem;
  });
});
