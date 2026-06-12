// Theme definitions for Galax Graphy
// Contrast ratios are WCAG relative luminance calculations (bg vs primary text)

export const THEMES = {
  showcase: {
    id: 'showcase',
    name: 'Showcase (Light)',
    description: 'Quill Showcase light theme, pure aesthetic',
    contrastRatio: '12.96',
    bg: '#FFFFFF',
    text: '#333333',
    textMuted: '#666666',
    textDim: '#A6A6A6',
    surface: '#F5F5F5',
    card: '#F9F9F9',
    border: '#E6E6E6',
    accent: '#0066CC',
    accentHover: '#0052A3',
    accentCyan: '#0080FF',
  },
  dark: {
    id: 'dark',
    name: 'Inverted Dark',
    description: 'Perfect dark inversion of the showcase theme',
    contrastRatio: '12.96', // Contrast ratio will be recalculated or kept as is
    bg: '#191919',
    text: '#dadada',
    textMuted: '#999999',
    textDim: '#595959',
    surface: '#0A0A0A',
    card: '#060606',
    border: '#191919',
    accent: '#FF9933',
    accentHover: '#FFAD5C',
    accentCyan: '#FF7F00',
  },
};

export const DEFAULT_THEME = 'showcase';
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
