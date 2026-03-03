import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { brandConfig, availableThemes, getThemeById, type BrandConfig } from '../config/branding';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  /** Currently active theme */
  currentTheme: BrandConfig;
  /** All available themes */
  availableThemes: BrandConfig[];
  /** Current theme mode (light/dark/system) */
  themeMode: ThemeMode;
  /** System color scheme preference */
  systemPreference: 'light' | 'dark';
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Change to a different theme */
  setTheme: (themeId: string) => void;
  /** Change theme mode */
  setMode: (mode: ThemeMode) => void;
  /** Whether theme switching is allowed */
  isThemeSwitchingAllowed: boolean;
  /** Whether dark mode is enabled for current theme */
  isDarkModeEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_THEME = 'ppd-theme-id';
const STORAGE_KEY_MODE = 'ppd-theme-mode';

interface ThemeProviderProps {
  children: ReactNode;
  defaultThemeId?: string;
}

export function ThemeProvider({ children, defaultThemeId }: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [currentTheme, setCurrentTheme] = useState<BrandConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) {
      const theme = getThemeById(saved);
      return theme;
    }
    return defaultThemeId ? getThemeById(defaultThemeId) : brandConfig;
  });

  // Initialize mode from localStorage or theme default
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as ThemeMode;
    }
    return currentTheme.colors.defaultMode;
  });

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculate if dark mode is active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPreference === 'dark');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme.id);
    document.documentElement.setAttribute('data-theme-mode', themeMode);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? currentTheme.colors.dark.background : currentTheme.colors.light.background);
    }
  }, [currentTheme, themeMode, isDark]);

  // Persist theme changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, currentTheme.id);
  }, [currentTheme]);

  // Persist mode changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODE, themeMode);
  }, [themeMode]);

  const setTheme = useCallback((themeId: string) => {
    const newTheme = getThemeById(themeId);
    if (!newTheme.colors.allowThemeSwitching && themeId !== currentTheme.id) {
      console.warn(`[Theme] Theme switching is disabled for theme: ${themeId}`);
      return;
    }
    setCurrentTheme(newTheme);
  }, [currentTheme.id]);

  const setMode = useCallback((mode: ThemeMode) => {
    if (!currentTheme.colors.enableDarkMode && mode !== 'light') {
      console.warn(`[Theme] Dark mode is disabled for current theme`);
      return;
    }
    setThemeMode(mode);
  }, [currentTheme.colors.enableDarkMode]);

  const value: ThemeContextType = {
    currentTheme,
    availableThemes,
    themeMode,
    systemPreference,
    isDark,
    setTheme,
    setMode,
    isThemeSwitchingAllowed: currentTheme.colors.allowThemeSwitching,
    isDarkModeEnabled: currentTheme.colors.enableDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
