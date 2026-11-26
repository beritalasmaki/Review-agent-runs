/**
 * The page's theme, for `ThemeToggle` (docs/DECISIONS.md, 0063): an explicit choice is
 * `data-theme` on <html> plus a remembered value; no choice is dark (docs/DECISIONS.md, 0142).
 */
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ledger:theme'

/** The theme the page shows now: an explicit choice on <html>, else dark (0142). */
export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme
  return chosen === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private windows); the choice then lasts until the page reloads.
  }
}
