import { useCallback, useEffect, useState } from 'react';
import { fetchTemplates } from '../api/templatesApi';
import {
  MAX_RECENT_SEARCHES,
  RECENT_SEARCHES_STORAGE_KEY,
} from '../constants';

function readRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(terms) {
  try {
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(terms));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {{ forceStatus?: 'empty' | 'error' | null }} options
 */
export function useTemplates({ forceStatus = null } = {}) {
  const [status, setStatus] = useState('loading');
  const [templates, setTemplates] = useState([]);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [retryCount, setRetryCount] = useState(0);

  const reload = useCallback(() => setRetryCount((n) => n + 1), []);

  useEffect(() => {
    if (forceStatus === 'empty') {
      setTemplates([]);
      setStatus('empty');
      return undefined;
    }

    if (forceStatus === 'error') {
      setTemplates([]);
      setStatus('error');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');

    fetchTemplates({ signal: controller.signal })
      .then((data) => {
        setTemplates(data);
        setStatus(data.length === 0 ? 'empty' : 'loaded');
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setTemplates([]);
        setStatus('error');
      });

    return () => controller.abort();
  }, [forceStatus, retryCount]);

  const saveRecentSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((t) => t !== trimmed)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      writeRecentSearches(next);
      return next;
    });
  }, []);

  return {
    templates,
    status,
    recentSearches,
    saveRecentSearch,
    reload,
  };
}
