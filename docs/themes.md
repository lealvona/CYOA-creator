# Theme System Documentation

Complete reference for the Interactive Story Engine theme system.

## Available Themes

### 1. Default (Dark)
The original PPD color scheme optimized for dark mode.

- **Primary**: Teal (#4ecdc4)
- **Secondary**: Coral (#ff6b6b)
- **Background**: Near-black (#0a0a0a)
- **Best for**: Default experience, video-focused content

### 2. PPD/UCSC
Official UC Santa Cruz university colors.

- **Primary**: UCSC Blue (#003c6c)
- **Secondary**: UCSC Gold (#fdc700)
- **Background**: Deep blue-gray (#0f172a)
- **Best for**: UCSC-affiliated projects, educational content

### 3. Classic
Neutral grays with subtle teal accents.

- **Primary**: Teal (#4ecdc4)
- **Secondary**: Slate (#64748b)
- **Background**: Off-white (#f8fafc) / Dark gray (#1e293b)
- **Best for**: Professional, understated appearance

### 4. High Contrast
Maximum accessibility with strong color differentiation.

- **Primary**: Bright cyan (#00bcd4)
- **Secondary**: Bright yellow (#ffeb3b)
- **Background**: Pure black (#000000) / Pure white (#ffffff)
- **Best for**: Accessibility requirements, vision impairments

### 5. Warm
Orange and red tones for energetic feel.

- **Primary**: Orange (#f97316)
- **Secondary**: Red (#dc2626)
- **Background**: Warm gray (#1c1917) / Cream (#fef3c7)
- **Best for**: Adventure stories, energetic content

### 6. Cool
Blue and purple tones for calm atmosphere.

- **Primary**: Indigo (#6366f1)
- **Secondary**: Purple (#8b5cf6)
- **Background**: Deep purple (#0f0a1e) / Light blue (#e0f2fe)
- **Best for**: Mystery stories, calm content

## Using Themes

### For Users

1. Click the theme icon in the header
2. Select from dropdown menu
3. Choose Light/Dark/System mode
4. Theme persists across sessions

### For Developers

Access theme in components:

```typescript
import { useTheme } from '../hooks/useTheme';

function MyComponent() {
  const { currentTheme, isDark, setTheme, setMode } = useTheme();
  
  return (
    <div style={{ color: currentTheme.colors.dark.text }}>
      Current theme: {currentTheme.name}
    </div>
  );
}
```

### CSS Variables

Themes expose CSS custom properties:

```css
.my-component {
  color: var(--brand-primary);
  background: var(--brand-bg);
  border: 1px solid var(--brand-border);
}
```

## Theme Configuration

### Structure

```typescript
interface BrandTheme {
  enableDarkMode: boolean;        // Allow light/dark toggle
  allowThemeSwitching: boolean;   // Allow changing themes
  defaultMode: 'light' | 'dark' | 'system';
  light: BrandColors;
  dark: BrandColors;
}
```

### Locking Themes

Prevent users from switching themes:

```typescript
const lockedTheme: BrandConfig = {
  colors: {
    allowThemeSwitching: false,  // Lock to this theme
    enableDarkMode: true,        // Still allow light/dark
    defaultMode: 'system',
    // ... colors
  },
  // ... rest of config
};
```

### Disabling Dark Mode

Force light mode only:

```typescript
const lightOnlyTheme: BrandConfig = {
  colors: {
    enableDarkMode: false,  // Disable dark mode toggle
    allowThemeSwitching: true,
    defaultMode: 'light',   // Always light
    // ... colors
  },
};
```

## Creating Custom Themes

### 1. Define Colors

Choose colors that work in both light and dark modes:

```typescript
const myTheme: BrandColors = {
  primary: '#your-primary-color',
  primaryHover: '#your-primary-hover',
  secondary: '#your-accent-color',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#ca8a04',
  background: '#your-bg-color',
  surface: '#your-card-color',
  text: '#your-text-color',
  textMuted: 'rgba(r, g, b, 0.6)',
  border: 'rgba(r, g, b, 0.12)',
};
```

### 2. Create Theme Config

```typescript
export const myCustomTheme: BrandConfig = {
  id: 'my-theme',
  name: 'My Custom Theme',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: true,
    defaultMode: 'system',
    light: myTheme,
    dark: myTheme,  // Adjust colors for dark mode
  },
  // ... typography, assets, meta
};
```

### 3. Register Theme

Add to theme list in `src/config/branding.ts`:

```typescript
export const availableThemes: BrandConfig[] = [
  defaultBrandConfig,
  ucscTheme,
  myCustomTheme,  // Add here
  // ... other themes
];
```

### 4. Test Theme

- Switch to your theme
- Check light and dark modes
- Verify color contrast
- Test on mobile

## System Preference Detection

Themes automatically detect system color scheme:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme-mode="light"]) {
    /* Dark mode colors */
  }
}
```

When `defaultMode: 'system'`:
- Respects OS-level dark mode setting
- Updates automatically when system changes
- Can be overridden by user

## Theme Persistence

Themes are saved to localStorage:

```javascript
// localStorage keys
localStorage.setItem('ppd-theme-id', 'ucsc');
localStorage.setItem('ppd-theme-mode', 'dark');
```

On app load:
1. Check localStorage for saved theme
2. If found, apply it
3. If not found, use default
4. Always respect theme lock setting

## Accessibility

### Color Contrast

All built-in themes meet WCAG AA standards:

- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### High Contrast Theme

Special theme for maximum visibility:
- Pure black/white backgrounds
- Bright, saturated colors
- Maximum text contrast
- Good for vision impairments

### Testing

Check your theme's accessibility:

1. Use Chrome DevTools accessibility panel
2. Run Lighthouse audit
3. Test with screen reader
4. Check keyboard navigation

## Theme Transitions

Smooth transitions between themes:

```css
* {
  transition: background-color 0.3s ease, 
              color 0.3s ease,
              border-color 0.3s ease;
}
```

To disable transitions (for testing):

```css
* {
  transition: none !important;
}
```

## Best Practices

### Color Selection

**Do:**
- Use your brand colors
- Test in both light and dark modes
- Ensure sufficient contrast
- Consider color blindness

**Don't:**
- Use pure black/white (harsh on eyes)
- Make light mode too bright
- Use similar colors for primary/secondary
- Ignore accessibility

### Theme Naming

**Good names:**
- Descriptive ("Ocean", "Sunset")
- Brand-related ("UCSC", "Corporate")
- Purpose-driven ("High Contrast", "Accessible")

**Avoid:**
- Generic names ("Theme 1", "Blue")
- Confusing names ("Light" when it's dark)
- Trademarked names without permission

### Performance

Themes use CSS custom properties:
- No JavaScript overhead
- Hardware-accelerated transitions
- Minimal memory footprint
- Fast theme switching

## Troubleshooting

### Theme Not Applying

**Check:**
- Theme ID matches registered themes
- CSS file is imported
- No JavaScript errors
- localStorage not blocked

### Colors Look Wrong

**Check:**
- Hex codes are valid
- CSS variables are defined
- No typos in config
- Browser cache cleared

### Theme Switching Broken

**Check:**
- `allowThemeSwitching: true`
- ThemeToggle component rendered
- ThemeContext provided
- No conflicts with other libraries

## API Reference

### useTheme Hook

```typescript
interface UseThemeReturn {
  currentTheme: BrandConfig;    // Current theme config
  availableThemes: BrandConfig[]; // All available themes
  themeMode: 'light' | 'dark';  // Current mode
  systemPreference: 'light' | 'dark'; // System preference
  isDark: boolean;              // Is dark mode active?
  setTheme: (id: string) => void;     // Change theme
  setMode: (mode: 'light' | 'dark' | 'system') => void; // Change mode
  isThemeSwitchingAllowed: boolean; // Can user switch?
}
```

### ThemeContext

```typescript
const ThemeContext = React.createContext<ThemeContextType>(null);

// Provider
<ThemeProvider>
  <App />
</ThemeProvider>
```

## Examples

### Seasonal Themes

```typescript
// Winter theme
const winterTheme: BrandConfig = {
  id: 'winter',
  colors: {
    primary: '#3b82f6',
    secondary: '#06b6d4',
    background: '#f0f9ff',
    // ...
  },
};

// Autumn theme
const autumnTheme: BrandConfig = {
  id: 'autumn',
  colors: {
    primary: '#d97706',
    secondary: '#dc2626',
    background: '#fffbeb',
    // ...
  },
};
```

### Holiday Themes

```typescript
// Holiday theme
const holidayTheme: BrandConfig = {
  id: 'holiday',
  colors: {
    primary: '#dc2626',
    secondary: '#16a34a',
    background: '#fef2f2',
    // ...
  },
};
```

---

For more information, see [Brand Customization Guide](branding.md).
