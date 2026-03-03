# Phase 1: Branding & Assets Isolation

## Overview

This phase establishes a comprehensive branding system with multiple preset themes including a UCSC/PPD theme, full theme customization support, and asset isolation for easy replacement.

## Branch
`feature/branding-placeholders`

## Implementation Steps

### Step 1.1: Create Brand Configuration System

**File**: `src/config/branding.ts`

Create TypeScript interfaces and configurations:

```typescript
// Core interfaces
interface BrandColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  danger: string;
  success: string;
  warning: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

interface BrandTheme {
  enableDarkMode: boolean;
  allowThemeSwitching: boolean;  // NEW: Lock themes
  defaultMode: 'light' | 'dark' | 'system';
  light: BrandColors;
  dark: BrandColors;
}

interface BrandConfig {
  id: string;
  name: string;
  colors: BrandTheme;
  typography: BrandTypography;
  assets: BrandAssets;
  meta: BrandMeta;
}
```

**Themes to Create**:

1. **Default (Dark)** - Original PPD colors
2. **PPD/UCSC** - UCSC blue (#003c6c) and gold (#fdc700)
3. **Classic** - Neutral grays with teal accent
4. **High Contrast** - Maximum accessibility
5. **Warm** - Orange/red tones
6. **Cool** - Blue/purple tones

**Key Features**:
- Theme lock functionality (`allowThemeSwitching: false`)
- System preference detection
- Full TypeScript type safety
- CSS generator function

### Step 1.2: Create Brand Assets

**Directory**: `public/branding/`

Create multi-layer SVG logo:

```svg
<!-- Campfire + Drama Masks Logo -->
<svg viewBox="0 0 200 200">
  <!-- Layer 1: Logs/Base -->
  <g id="logs">
    <!-- Crossed logs at bottom -->
  </g>
  
  <!-- Layer 2: Flames -->
  <g id="flames">
    <!-- Animated/multiple flame paths -->
  </g>
  
  <!-- Layer 3: Drama Masks -->
  <g id="masks">
    <!-- Comedy mask (smiling) -->
    <!-- Tragedy mask (frowning) -->
    <!-- Positioned within flames -->
  </g>
  
  <!-- Layer 4: Text -->
  <text x="100" y="180" text-anchor="middle">CYOA</text>
</svg>
```

**Logo Requirements**:
- Multi-layer for potential animation
- Campfire base with logs
- Drama masks (comedy/tragedy) integrated with flames
- Detailed and stylized (not simplistic)
- "CYOA" text correlated to theme
- Works at multiple sizes (16px to 512px)

**Additional Assets**:
- `favicon.ico` - 16x16, 32x32 multi-resolution
- `app-icon.png` - 512x512 for PWA
- `hero-bg.svg` - Theme-specific backgrounds

### Step 1.3: Create Theme Context System

**File**: `src/contexts/ThemeContext.tsx`

Implement features:

```typescript
interface ThemeContextType {
  currentTheme: BrandConfig;
  availableThemes: BrandConfig[];
  themeMode: 'light' | 'dark';
  systemPreference: 'light' | 'dark';
  setTheme: (themeId: string) => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  isThemeSwitchingAllowed: boolean;
  isDark: boolean;
}
```

**Features**:
- Multiple theme support
- System preference detection (`prefers-color-scheme`)
- localStorage persistence
- Theme lock enforcement
- Mode persistence (light/dark/system)
- CSS class injection

**File**: `src/hooks/useTheme.ts`

Simple hook wrapper for consuming theme context.

### Step 1.4: Create Theme Variables CSS

**File**: `src/styles/brand-variables.css`

Generate CSS from brand config:

```css
:root {
  /* Typography */
  --brand-font-family: "Inter", system-ui, sans-serif;
  --brand-base-size: 16px;
  
  /* Colors - Default/Dark */
  --brand-primary: #4ecdc4;
  --brand-primary-hover: #45b8b0;
  /* ... all colors ... */
}

[data-theme="ppd-ucsc"] {
  --brand-primary: #003c6c;
  --brand-primary-hover: #002d52;
  --brand-secondary: #fdc700;
  /* UCSC colors */
}

[data-theme="warm"] {
  /* Warm tones */
}

[data-theme="cool"] {
  /* Cool tones */
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme-mode="dark"]) {
    /* Light mode colors */
  }
}
```

### Step 1.5: Update Global Styles

**File**: `src/index.css`

Changes:
- Import brand variables
- Replace hardcoded colors with brand variables
- Add theme transition animations
- Ensure all components inherit brand styles

### Step 1.6: Update Components

**Files to Update**:

1. **`src/components/StartScreen.tsx`**
   - Display brand logo
   - Use brand colors
   - Show organization name from config
   - Use brand typography

2. **`src/components/StoryLibrary.tsx`**
   - Add theme toggle (if allowed)
   - Display logo in header
   - Use brand colors for cards/buttons

3. **`src/components/StoryViewer.tsx`**
   - Apply theme to overlay
   - Use brand colors for UI elements

4. **`index.html`**
   - Dynamic favicon based on theme
   - Dynamic theme-color meta tag
   - Preload brand assets

### Step 1.7: Commit and Create PR

**Commit Message**:
```
feat: Add comprehensive branding system with multiple themes

- Create brand configuration system with 6 preset themes
- Add UCSC/PPD theme with official colors
- Implement theme context with system preference detection
- Create multi-layer campfire + drama masks logo
- Add theme lock functionality for institutional branding
- Update all components to use brand variables
- Add CSS variable system for easy customization

Themes included:
- Default (Dark)
- PPD/UCSC
- Classic
- High Contrast
- Warm
- Cool
```

**PR Checklist**:
- [ ] All themes render correctly
- [ ] Theme switching works
- [ ] System preference detection works
- [ ] localStorage persistence works
- [ ] Theme lock functionality works
- [ ] Logo displays correctly at all sizes
- [ ] No console errors
- [ ] All existing tests pass

## UCSC Theme Specifications

**Official Colors**:
- Primary Blue: `#003c6c`
- Secondary Gold: `#fdc700`
- Light Blue: `#006aad`
- Dark Blue: `#002d52`

**Typography**:
- Maintain Inter font family
- Add UCSC-specific heading treatment

**Assets**:
- Use UCSC colors in logo flames
- Gold accents for drama masks
- Blue background gradient

## Testing Checklist

- [ ] Switch between all 6 themes
- [ ] Verify theme persists after reload
- [ ] Test system preference detection
- [ ] Lock themes and verify switching is disabled
- [ ] Check logo renders at 16px, 32px, 64px, 128px, 512px
- [ ] Verify favicon updates with theme
- [ ] Test high contrast theme accessibility
- [ ] Ensure smooth transitions between themes

## Next Phase

After completing Phase 1, proceed to [Phase 2: Documentation Restructure](phase2-documentation.md).
