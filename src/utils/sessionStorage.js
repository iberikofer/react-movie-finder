/**
 * Utility functions for session-based page state & scroll position restoration.
 * Uses window.sessionStorage so state survives route changes and back/forward
 * navigations within the tab, but clears automatically when the tab is closed.
 */

export const savePageSession = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save session for "${key}":`, err);
  }
};

export const getPageSession = key => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed to retrieve session for "${key}":`, err);
    return null;
  }
};

export const updatePageScroll = (key, scrollY) => {
  try {
    const existing = getPageSession(key);
    if (existing) {
      existing.scrollY = Math.max(0, Math.round(scrollY));
      sessionStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (err) {
    console.warn(`Failed to update scroll for "${key}":`, err);
  }
};

export const hasSavedPageScroll = key => {
  try {
    const session = getPageSession(key);
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
