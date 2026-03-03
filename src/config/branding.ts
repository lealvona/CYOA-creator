/**
 * Branding Configuration System
 * 
 * This file contains all brand-related configuration for the Interactive Video Story Engine.
 * Educational institutions can customize these values to match their branding.
 * 
 * To customize:
 * 1. Copy this file to `branding.custom.ts`
 * 2. Modify the values below
 * 3. Update imports in components to use your custom config
 */

export interface BrandColors {
  /** Primary brand color - used for buttons, accents, highlights */
  primary: string;
  /** Primary color hover state */
  primaryHover: string;
  /** Secondary/accent color - used for gradients, highlights */
  secondary: string;
  /** Danger/error color */
  danger: string;
  /** Success/confirmation color */
  success: string;
  /** Warning color */
  warning: string;
  /** Background color */
  background: string;
  /** Surface/card color */
  surface: string;
  /** Primary text color */
  text: string;
  /** Secondary/muted text color */
  textMuted: string;
  /** Border color */
  border: string;
}

export interface BrandTypography {
  /** Primary font family */
  fontFamily: string;
  /** Heading font family (optional, falls back to primary) */
  headingFontFamily?: string;
  /** Base font size */
  baseSize: string;
  /** Line height */
  lineHeight: number;
}

export interface BrandAssets {
  /** Logo URL/path - displayed in header and start screen */
  logo: string;
  /** Favicon path */
  favicon: string;
  /** App icon for PWA/manifest */
  appIcon?: string;
  /** Hero/background images */
  heroBackground?: string;
  /** Loading spinner animation */
  loadingAnimation?: string;
}

export interface BrandMeta {
  /** Application name */
  appName: string;
  /** Short tagline */
  tagline: string;
  /** Full description */
  description: string;
  /** Organization/institution name */
  organization: string;
  /** Copyright year */
  copyrightYear: number;
  /** Support contact */
  supportEmail?: string;
  /** Documentation URL */
  docsUrl?: string;
  /** Privacy policy URL */
  privacyUrl?: string;
  /** Terms of service URL */
  termsUrl?: string;
}

export interface BrandTheme {
  /** Enable dark mode toggle */
  enableDarkMode: boolean;
  /** Allow users to switch between themes */
  allowThemeSwitching: boolean;
  /** Default theme mode */
  defaultMode: 'light' | 'dark' | 'system';
  /** Light mode colors */
  light: BrandColors;
  /** Dark mode colors */
  dark: BrandColors;
}

export interface BrandConfig {
  /** Unique theme identifier */
  id: string;
  /** Display name for the theme */
  name: string;
  colors: BrandTheme;
  typography: BrandTypography;
  assets: BrandAssets;
  meta: BrandMeta;
}

// UCSC Official Colors
const UCSC_BLUE = '#003c6c';
const UCSC_GOLD = '#fdc700';
const UCSC_LIGHT_BLUE = '#006aad';
const UCSC_DARK_BLUE = '#002d52';

/**
 * Default brand configuration
 * Based on the original Interactive PPD styling
 */
export const defaultBrandConfig: BrandConfig = {
  id: 'default',
  name: 'Default',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'dark',
    light: {
      primary: '#4ecdc4',
      primaryHover: '#45b8b0',
      secondary: '#ff6b6b',
      danger: '#ff6b6b',
      success: '#4ecdc4',
      warning: '#f1af01',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1a1a2e',
      textMuted: 'rgba(26, 26, 46, 0.6)',
      border: 'rgba(26, 26, 46, 0.12)',
    },
    dark: {
      primary: '#4ecdc4',
      primaryHover: '#45b8b0',
      secondary: '#ff6b6b',
      danger: '#ff6b6b',
      success: '#4ecdc4',
      warning: '#f1af01',
      background: '#0a0a0a',
      surface: '#1a1a2e',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseSize: '16px',
    lineHeight: 1.5,
  },
  assets: {
    logo: '/branding/logo.svg',
    favicon: '/branding/favicon.ico',
    appIcon: '/branding/app-icon.png',
    heroBackground: '/branding/hero-bg.svg',
  },
  meta: {
    appName: 'Interactive Story Engine',
    tagline: 'Create immersive choose-your-own-adventure experiences',
    description: 'A web application for creating interactive video stories with branching narratives and multiple endings.',
    organization: 'Interactive PPD Team',
    copyrightYear: 2026,
    supportEmail: 'support@example.edu',
    docsUrl: 'https://docs.example.edu',
  },
};

/**
 * UCSC/PPD Theme
 * Uses official UC Santa Cruz university colors
 */
export const ucscTheme: BrandConfig = {
  id: 'ucsc',
  name: 'PPD/UCSC',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'system',
    light: {
      primary: UCSC_BLUE,
      primaryHover: UCSC_DARK_BLUE,
      secondary: UCSC_GOLD,
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: 'rgba(30, 41, 59, 0.6)',
      border: 'rgba(30, 41, 59, 0.12)',
    },
    dark: {
      primary: UCSC_LIGHT_BLUE,
      primaryHover: '#005a8c',
      secondary: UCSC_GOLD,
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#eab308',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: 'rgba(241, 245, 249, 0.6)',
      border: 'rgba(241, 245, 249, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseSize: '16px',
    lineHeight: 1.5,
  },
  assets: {
    logo: '/branding/logo.svg',
    favicon: '/branding/favicon.ico',
    appIcon: '/branding/app-icon.png',
    heroBackground: '/branding/hero-bg-ucsc.svg',
  },
  meta: {
    appName: 'Interactive Story Engine',
    tagline: 'UCSC Interactive Storytelling Platform',
    description: 'An interactive video storytelling platform for UC Santa Cruz.',
    organization: 'UC Santa Cruz',
    copyrightYear: 2026,
    supportEmail: 'support@ucsc.edu',
    docsUrl: 'https://docs.ucsc.edu/stories',
  },
};

/**
 * Classic Theme
 * Neutral grays with teal accent
 */
export const classicTheme: BrandConfig = {
  id: 'classic',
  name: 'Classic',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'system',
    light: {
      primary: '#0d9488',
      primaryHover: '#0f766e',
      secondary: '#64748b',
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: 'rgba(30, 41, 59, 0.6)',
      border: 'rgba(30, 41, 59, 0.12)',
    },
    dark: {
      primary: '#14b8a6',
      primaryHover: '#0d9488',
      secondary: '#94a3b8',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#eab308',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: 'rgba(241, 245, 249, 0.6)',
      border: 'rgba(241, 245, 249, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseSize: '16px',
    lineHeight: 1.5,
  },
  assets: {
    logo: '/branding/logo.svg',
    favicon: '/branding/favicon.ico',
    appIcon: '/branding/app-icon.png',
    heroBackground: '/branding/hero-bg.svg',
  },
  meta: {
    appName: 'Interactive Story Engine',
    tagline: 'Classic interactive storytelling',
    description: 'A classic-styled interactive video storytelling platform.',
    organization: 'Interactive PPD Team',
    copyrightYear: 2026,
    supportEmail: 'support@example.edu',
    docsUrl: 'https://docs.example.edu',
  },
};

/**
 * High Contrast Theme
 * Maximum accessibility with strong color differentiation
 */
export const highContrastTheme: BrandConfig = {
  id: 'high-contrast',
  name: 'High Contrast',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'dark',
    light: {
      primary: '#0000ff',
      primaryHover: '#0000cc',
      secondary: '#ff00ff',
      danger: '#ff0000',
      success: '#008000',
      warning: '#ff8c00',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textMuted: '#333333',
      border: '#000000',
    },
    dark: {
      primary: '#00ffff',
      primaryHover: '#00cccc',
      secondary: '#ffff00',
      danger: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      textMuted: '#cccccc',
      border: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseSize: '18px',
    lineHeight: 1.6,
  },
  assets: {
    logo: '/branding/logo.svg',
    favicon: '/branding/favicon.ico',
    appIcon: '/branding/app-icon.png',
    heroBackground: '/branding/hero-bg.svg',
  },
  meta: {
    appName: 'Interactive Story Engine',
    tagline: 'Accessible interactive storytelling',
    description: 'High contrast theme for maximum accessibility.',
    organization: 'Interactive PPD Team',
    copyrightYear: 2026,
    supportEmail: 'support@example.edu',
    docsUrl: 'https://docs.example.edu',
  },
};

/**
 * Warm Theme
 * Orange and red tones for energetic feel
 */
export const warmTheme: BrandConfig = {
  id: 'warm',
  name: 'Warm',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'system',
    light: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      secondary: '#dc2626',
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#431407',
      textMuted: 'rgba(67, 20, 7, 0.6)',
      border: 'rgba(67, 20, 7, 0.12)',
    },
    dark: {
      primary: '#fb923c',
      primaryHover: '#f97316',
      secondary: '#f87171',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#eab308',
      background: '#1c1917',
      surface: '#292524',
      text: '#fafaf9',
      textMuted: 'rgba(250, 250, 249, 0.6)',
      border: 'rgba(250, 250, 249, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseSize: '16px',
    lineHeight: 1.5,
  },
  assets: {
    logo: '/branding/logo.svg',
    favicon: '/branding/favicon.ico',
    appIcon: '/branding/app-icon.png',
    heroBackground: '/branding/hero-bg-warm.svg',
  },
  meta: {
    appName: 'Interactive Story Engine',
    tagline: 'Warm and energetic storytelling',
    description: 'Warm-toned theme for adventure stories.',
    organization: 'Interactive PPD Team',
    copyrightYear: 2026,
    supportEmail: 'support@example.edu',
    docsUrl: 'https://docs.example.edu',
  },
};

/**
 * Cool Theme
 * Blue and purple tones for calm atmosphere
 */
export const coolTheme: BrandConfig = {
  id: 'cool',
  name: 'Cool',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'system',
    light: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      secondary: '#8b5cf6',
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
      background: '#eef2ff',
      surface: '#ffffff',
      text: '#1e1b4b',
      textMuted: 'rgba(30, 27, 75, 0.6)',
      border: 'rgba(30, 27, 75, 0.12)',
    },
    dark: {
      primary: '#818cf8',
      primaryHover: '#6366f1',
      secondary: '#a78bfa',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#eab308',
      background: '#0f0a1e',
      surface: '#1e1b4b',
      text: '#e0e7ff',
      textMuted: 'rgba(224, 231, 255, 0.6)',
      border: 'rgba(224, 231, 255, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    baseSize: '16px',
    lineHeight: 1.5,
  },
  assets: {
    logo: '/branding/logo.svg',
    favicon: '/branding/favicon.ico',
    appIcon: '/branding/app-icon.png',
    heroBackground: '/branding/hero-bg-cool.svg',
  },
  meta: {
    appName: 'Interactive Story Engine',
    tagline: 'Calm and mysterious storytelling',
    description: 'Cool-toned theme for mystery stories.',
    organization: 'Interactive PPD Team',
    copyrightYear: 2026,
    supportEmail: 'support@example.edu',
    docsUrl: 'https://docs.example.edu',
  },
};

/**
 * Educational Institution Template
 * Uncomment and customize for your institution
 */
/*
export const educationalBrandConfig: BrandConfig = {
  id: 'my-institution',
  name: 'My Institution',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: false,  // Lock to your brand
    defaultMode: 'system',
    light: {
      primary: '#003366',      // Your institution's primary color
      primaryHover: '#002244',
      secondary: '#cc9900',    // Your institution's secondary color
      danger: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1e293b',
      textMuted: 'rgba(30, 41, 59, 0.6)',
      border: 'rgba(30, 41, 59, 0.12)',
    },
    dark: {
      primary: '#4a90e2',      // Adjusted for dark mode
      primaryHover: '#357abd',
      secondary: '#f4c430',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#eab308',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: 'rgba(241, 245, 249, 0.6)',
      border: 'rgba(241, 245, 249, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    headingFontFamily: '"Your Institution Font", system-ui, sans-serif',
    baseSize: '16px',
    lineHeight: 1.6,
  },
  assets: {
    logo: '/branding/institution-logo.svg',
    favicon: '/branding/institution-favicon.ico',
    appIcon: '/branding/institution-app-icon.png',
    heroBackground: '/branding/institution-hero-bg.jpg',
  },
  meta: {
    appName: 'Your Institution Story Platform',
    tagline: 'Interactive learning through immersive storytelling',
    description: 'An educational platform for creating and experiencing interactive video stories.',
    organization: 'Your Institution Name',
    copyrightYear: 2026,
    supportEmail: 'help@institution.edu',
    docsUrl: 'https://help.institution.edu/stories',
    privacyUrl: 'https://institution.edu/privacy',
    termsUrl: 'https://institution.edu/terms',
  },
};
*/

/**
 * All available themes
 */
export const availableThemes: BrandConfig[] = [
  defaultBrandConfig,
  ucscTheme,
  classicTheme,
  highContrastTheme,
  warmTheme,
  coolTheme,
  // Add custom themes here
];

/**
 * Get theme by ID
 */
export function getThemeById(id: string): BrandConfig {
  return availableThemes.find(theme => theme.id === id) || defaultBrandConfig;
}

/**
 * Check if theme allows switching
 */
export function isThemeSwitchingAllowed(theme: BrandConfig): boolean {
  return theme.colors.allowThemeSwitching;
}

// Export the active brand configuration
// Change this to use your custom config
export const brandConfig: BrandConfig = defaultBrandConfig;

// Helper function to generate CSS custom properties
export function generateBrandCSS(config: BrandConfig = brandConfig): string {
  const { light, dark } = config.colors;
  
  return `
:root {
  /* Brand Typography */
  --brand-font-family: ${config.typography.fontFamily};
  --brand-heading-font-family: ${config.typography.headingFontFamily || config.typography.fontFamily};
  --brand-base-size: ${config.typography.baseSize};
  --brand-line-height: ${config.typography.lineHeight};
  
  /* Light Mode Colors (default) */
  --brand-primary: ${light.primary};
  --brand-primary-hover: ${light.primaryHover};
  --brand-secondary: ${light.secondary};
  --brand-danger: ${light.danger};
  --brand-success: ${light.success};
  --brand-warning: ${light.warning};
  --brand-bg: ${light.background};
  --brand-surface: ${light.surface};
  --brand-text: ${light.text};
  --brand-text-muted: ${light.textMuted};
  --brand-border: ${light.border};
  
  /* Asset paths */
  --brand-logo: url('${config.assets.logo}');
  --brand-hero-bg: url('${config.assets.heroBackground || ''}');
}

[data-theme="${config.id}"][data-theme-mode="dark"],
[data-theme="${config.id}"][data-theme-mode="system"] {
  --brand-primary: ${dark.primary};
  --brand-primary-hover: ${dark.primaryHover};
  --brand-secondary: ${dark.secondary};
  --brand-danger: ${dark.danger};
  --brand-success: ${dark.success};
  --brand-warning: ${dark.warning};
  --brand-bg: ${dark.background};
  --brand-surface: ${dark.surface};
  --brand-text: ${dark.text};
  --brand-text-muted: ${dark.textMuted};
  --brand-border: ${dark.border};
}

@media (prefers-color-scheme: dark) {
  [data-theme="${config.id}"][data-theme-mode="system"] {
    --brand-primary: ${dark.primary};
    --brand-primary-hover: ${dark.primaryHover};
    --brand-secondary: ${dark.secondary};
    --brand-danger: ${dark.danger};
    --brand-success: ${dark.success};
    --brand-warning: ${dark.warning};
    --brand-bg: ${dark.background};
    --brand-surface: ${dark.surface};
    --brand-text: ${dark.text};
    --brand-text-muted: ${dark.textMuted};
    --brand-border: ${dark.border};
  }
}
  `.trim();
}

export default brandConfig;
