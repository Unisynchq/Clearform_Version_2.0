import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchTemplates } from '../api/templatesApi';
import { readSavedTemplates } from '../utils/savedTemplatesStorage';
import { toUserTemplateCatalogItem } from '../utils/userTemplateCatalog';
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
  const userEmail = useSelector((s) => s.auth.email);
  const [status, setStatus] = useState('loading');
  const [templates, setTemplates] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [retryCount, setRetryCount] = useState(0);

  const loadUserTemplates = useCallback(() => {
    setUserTemplates(readSavedTemplates(userEmail).map(toUserTemplateCatalogItem));
  }, [userEmail]);

  const reload = useCallback(() => {
    loadUserTemplates();
    setRetryCount((n) => n + 1);
  }, [loadUserTemplates]);

  useEffect(() => {
    loadUserTemplates();
  }, [loadUserTemplates]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'clearform_saved_templates') loadUserTemplates();
    };
    const onUpdated = () => loadUserTemplates();
    window.addEventListener('storage', onStorage);
    window.addEventListener('clearform:user-templates-updated', onUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('clearform:user-templates-updated', onUpdated);
    };
  }, [loadUserTemplates]);

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
    userTemplates,
    status,
    recentSearches,
    saveRecentSearch,
    reload,
    loadUserTemplates,
  };
}
