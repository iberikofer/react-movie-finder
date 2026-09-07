/**
 * Utility functions for session-based page state & scroll position restoration.
 * Uses window.sessionStorage so state survives route changes and back/forward
 * navigations within the tab, but clears automatically when the tab is closed.
 *
 * Supports multi-state caching per filterKey so navigating back/forward
 * between different filters, search queries, and pages correctly restores
 * both the previous and next states (including pagination and scroll position).
 */

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const parseRoot = key => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { latestFilterKey: '', states: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !parsed.states && parsed.filterKey) {
      return {
        latestFilterKey: parsed.filterKey,
        states: {
          [parsed.filterKey]: parsed,
        },
      };
    }
    if (parsed && typeof parsed === 'object' && parsed.states) {
      return parsed;
    }
    return { latestFilterKey: '', states: {} };
  } catch (err) {
    console.warn(`Failed to parse session for "${key}":`, err);
    return { latestFilterKey: '', states: {} };
  }
};

const writeRoot = (key, root) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(root));
  } catch (err) {
    console.warn(`Failed to write session for "${key}":`, err);
  }
};

export const savePageSession = (key, filterKeyOrData, maybeData) => {
  try {
    let filterKey;
    let data;
    if (typeof filterKeyOrData === 'string') {
      filterKey = filterKeyOrData;
      data = maybeData;
    } else {
      data = filterKeyOrData;
      filterKey = data?.filterKey || '__default__';
    }

    if (!data || typeof data !== 'object') return;

    const root = parseRoot(key);
    root.latestFilterKey = filterKey;
    root.states[filterKey] = {
      ...data,
      filterKey,
      updatedAt: Date.now(),
    };

    const keys = Object.keys(root.states);
    if (keys.length > 15) {
      const sortedKeys = keys.sort(
        (a, b) => (root.states[a]?.updatedAt || 0) - (root.states[b]?.updatedAt || 0)
      );
      while (sortedKeys.length > 15) {
        const oldest = sortedKeys.shift();
        delete root.states[oldest];
      }
    }

    writeRoot(key, root);
  } catch (err) {
    console.warn(`Failed to save session for "${key}":`, err);
  }
};

export const getPageSession = (key, filterKey) => {
  try {
    const root = parseRoot(key);
    const targetKey =
      typeof filterKey === 'string' && filterKey.trim()
        ? filterKey
        : root.latestFilterKey;
    if (!targetKey) return null;
    return root.states[targetKey] || null;
  } catch (err) {
    console.warn(`Failed to retrieve session for "${key}":`, err);
    return null;
  }
};

export const updatePageScroll = (key, scrollY, filterKey = null, force = false) => {
  try {
    const root = parseRoot(key);
    const targetKey =
      typeof filterKey === 'string' && filterKey.trim()
        ? filterKey
        : root.latestFilterKey;
    if (!targetKey || !root.states[targetKey]) return;

    const existing = root.states[targetKey];
    const rounded = Math.max(0, Math.round(scrollY));

    if (!force && rounded === 0 && existing.scrollY > 0) {
      return;
    }

    existing.scrollY = rounded;
    existing.updatedAt = Date.now();
    writeRoot(key, root);
  } catch (err) {
    console.warn(`Failed to update scroll for "${key}":`, err);
  }
};

export const hasSavedPageScroll = (key, filterKey = null) => {
  try {
    const session = getPageSession(key, filterKey);
    return Boolean(session && typeof session.scrollY === 'number' && session.scrollY > 0);
  } catch {
    return false;
  }
};

export const clearPageSession = key => {
  try {
    sessionStorage.removeItem(key);
  } catch (err) {
    console.warn(`Failed to clear session for "${key}":`, err);
  }
};
