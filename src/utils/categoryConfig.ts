export type CategoryConfig = {
  bgLight: string;
  accent: string;
  accentLight: string;
  emoji: string;
};

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'Mental hälsa': { bgLight: '#daeeda', accent: '#2a6e2a', accentLight: '#b8e6b8', emoji: '🧘' },
  'Socialt':      { bgLight: '#ccd8ea', accent: '#2b5282', accentLight: '#b8cfe8', emoji: '👥' },
  'Träning':      { bgLight: '#e8cccc', accent: '#8b2020', accentLight: '#e8b8b8', emoji: '🏋️' },
  'Plugg':        { bgLight: '#e8e4c0', accent: '#7a6e10', accentLight: '#e0da9a', emoji: '📚' },
  'Hem':          { bgLight: '#d8ccec', accent: '#5c3d8a', accentLight: '#cbb8e8', emoji: '🏠' },
  'Övrigt':       { bgLight: '#cdd2d0', accent: '#546361', accentLight: '#b8c0be', emoji: '🔘' },
};

export const DEFAULT_CONFIG: CategoryConfig = {
  bgLight: '#f8faf8', accent: '#1d6d2b', accentLight: '#a4f6a3', emoji: '⏱️',
};

export function getCategoryConfig(category?: string): CategoryConfig {
  return (category && CATEGORY_CONFIG[category]) ?? DEFAULT_CONFIG;
}
