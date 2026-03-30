const THEME_KEY = 'theme'

function getPreferredTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function initializeTheme() {
  if (typeof document === 'undefined') return 'dark'

  const storedTheme = window.localStorage.getItem(THEME_KEY)
  const initialTheme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : getPreferredTheme()

  document.documentElement.setAttribute('data-theme', initialTheme)
  return initialTheme
}

export function setTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', nextTheme)
  window.localStorage.setItem(THEME_KEY, nextTheme)
  return nextTheme
}
