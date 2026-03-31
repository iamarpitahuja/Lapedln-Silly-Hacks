export function initializeTheme() {
  if (typeof document === 'undefined') return 'dark'
  document.documentElement.setAttribute('data-theme', 'dark')
  return 'dark'
}
