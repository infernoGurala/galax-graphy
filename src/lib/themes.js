// Theme definitions for Galax Graphy
// Contrast ratios are WCAG relative luminance calculations (bg vs primary text)

export const THEMES = {
  nebula: {
    id: 'nebula',
    name: 'Nebula',
    description: 'Deep cosmic dark, balanced contrast',
    contrastRatio: '15.02',
    bg: '#1A191C',
    text: '#E8EFEF',
    textMuted: '#6B6A6E',
    textDim: '#48474A',
    surface: '#242328',
    card: '#242328',
    border: '#2E2D31',
    accent: '#8b5cf6',
    accentHover: '#a78bfa',
    accentCyan: '#06b6d4',
  },
  abyss: {
    id: 'abyss',
    name: 'Abyss',
    description: 'Deep indigo void, ultra-crisp text',
    contrastRatio: '16.48',
    bg: '#111127',
    text: '#EBF2FF',
    textMuted: '#5C5C7A',
    textDim: '#3A3A52',
    surface: '#1A1A35',
    card: '#1A1A35',
    border: '#26263F',
    accent: '#818cf8',
    accentHover: '#a5b4fc',
    accentCyan: '#22d3ee',
  },
};

export const DEFAULT_THEME = 'nebula';
export const LS_THEME_KEY = 'galax_theme';

export function getStoredTheme() {
  return localStorage.getItem(LS_THEME_KEY) || DEFAULT_THEME;
}

export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;

  root.setAttribute('data-theme', themeId);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-text-dim', theme.textDim);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-card', theme.card);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--color-accent-hover', theme.accentHover);
  root.style.setProperty('--color-accent-cyan', theme.accentCyan);
  // Also update root background to avoid flash
  root.style.backgroundColor = theme.bg;

  localStorage.setItem(LS_THEME_KEY, themeId);
}
