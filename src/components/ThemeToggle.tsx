import { type FC } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { ThemeMode } from '../contexts/ThemeContext';
import type { BrandConfig } from '../config/branding';
import './ThemeToggle.css';

export interface ThemeToggleProps {
  variant?: 'dropdown' | 'button' | 'minimal';
  showModeSelector?: boolean;
}

const ThemeIcon: FC<{ isDark: boolean }> = ({ isDark }) => (
  isDark ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
);

// Theme preview badge with primary and secondary colors
const ThemePreviewBadge: FC<{ theme: BrandConfig; isDark: boolean }> = ({ theme, isDark }) => {
  const colors = isDark ? theme.colors.dark : theme.colors.light;
  return (
    <div 
      className="theme-color-preview"
      style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 50%, ${colors.secondary} 50%)`,
      }}
    />
  );
};

// Theme icon based on theme type
const ThemeTypeIcon: FC<{ themeId: string }> = ({ themeId }) => {
  const icons: Record<string, React.ReactNode> = {
    default: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    ucsc: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    classic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
    'high-contrast': (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
      </svg>
    ),
    warm: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    cool: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 8V4M8 12H4M12 16v4M16 12h4" />
      </svg>
    ),
  };
  
  return (
    <span className="theme-type-icon">
      {icons[themeId] || icons.default}
    </span>
  );
};

export const ThemeToggle: FC<ThemeToggleProps> = ({ 
  variant = 'dropdown',
  showModeSelector = true 
}) => {
  const { 
    currentTheme, 
    availableThemes, 
    themeMode, 
    isDark, 
    setTheme, 
    setMode,
    isThemeSwitchingAllowed,
    isDarkModeEnabled 
  } = useTheme();

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
  };

  const handleModeChange = (mode: ThemeMode) => {
    setMode(mode);
  };

  if (variant === 'minimal') {
    return (
      <button 
        className="theme-toggle-minimal"
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        disabled={!isDarkModeEnabled}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <ThemeIcon isDark={isDark} />
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button 
        className="theme-toggle-button"
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        disabled={!isDarkModeEnabled}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <ThemeIcon isDark={isDark} />
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>
    );
  }

  return (
    <div className="theme-toggle-dropdown">
      <button 
        className="theme-toggle-trigger"
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <ThemeIcon isDark={isDark} />
        <span className="theme-toggle-label">{currentTheme.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      
      <div className="theme-toggle-menu" role="listbox">
          {isThemeSwitchingAllowed && (
            <div className="theme-section">
              <div className="theme-section-title">Theme</div>
              {availableThemes.map(theme => (
                <button
                  key={theme.id}
                  className={`theme-option ${theme.id === currentTheme.id ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                  role="option"
                  aria-selected={theme.id === currentTheme.id}
                  title={`Select ${theme.name} theme`}
                >
                  <ThemeTypeIcon themeId={theme.id} />
                  <span className="theme-name">{theme.name}</span>
                  <ThemePreviewBadge theme={theme} isDark={isDark} />
                  {theme.id === currentTheme.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        
        {showModeSelector && isDarkModeEnabled && (
          <div className="theme-section">
            <div className="theme-section-title">Mode</div>
            {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
              <button
                key={mode}
                className={`theme-option ${mode === themeMode ? 'active' : ''}`}
                onClick={() => handleModeChange(mode)}
                role="option"
                aria-selected={mode === themeMode}
              >
                <span className="theme-mode-icon">
                  {mode === 'light' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>}
                  {mode === 'dark' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
                  {mode === 'system' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
                </span>
                <span className="theme-name capitalize">{mode}</span>
                {mode === themeMode && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeToggle;
