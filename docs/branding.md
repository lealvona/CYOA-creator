# Brand Customization Guide

This guide helps you customize the Interactive Story Engine to match your organization's branding.

## Quick Start

1. Fork the repository
2. Create `src/config/branding.custom.ts`
3. Copy from the educational template in `src/config/branding.ts`
4. Customize colors, fonts, and assets
5. Update `src/config/branding.ts` to export your custom config
6. Replace assets in `public/branding/`
7. Test thoroughly

## Understanding the Brand System

### Configuration File

The brand configuration is in `src/config/branding.ts`:

```typescript
export interface BrandConfig {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  colors: BrandTheme;           // Light/dark mode colors
  typography: BrandTypography;  // Font settings
  assets: BrandAssets;          // Logo, favicon, etc.
  meta: BrandMeta;              // App info
}
```

### Color System

Each theme has light and dark mode colors:

```typescript
interface BrandColors {
  primary: string;        // Main brand color (buttons, accents)
  primaryHover: string;   // Hover state
  secondary: string;      // Accent color
  danger: string;         // Errors
  success: string;        // Success states
  warning: string;        // Warnings
  background: string;     // Page background
  surface: string;        // Card backgrounds
  text: string;          // Main text
  textMuted: string;     // Secondary text
  border: string;        // Borders
}
```

### Educational Institution Template

Use this template for universities, schools, and educational organizations:

```typescript
export const educationalBrandConfig: BrandConfig = {
  id: 'my-institution',
  name: 'My Institution Theme',
  colors: {
    enableDarkMode: true,
    allowThemeSwitching: false,  // Lock to your brand
    defaultMode: 'system',
    light: {
      primary: '#003366',      // Your primary color
      primaryHover: '#002244',
      secondary: '#cc9900',    // Your secondary color
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
    headingFontFamily: '"Your Font", system-ui, sans-serif',
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
    description: 'An educational platform for creating interactive video stories.',
    organization: 'Your Institution Name',
    copyrightYear: 2026,
    supportEmail: 'help@institution.edu',
    docsUrl: 'https://help.institution.edu/stories',
    privacyUrl: 'https://institution.edu/privacy',
    termsUrl: 'https://institution.edu/terms',
  },
};
```

## Best Practices

### Color Contrast

Ensure accessibility by maintaining proper contrast ratios:

| Element | Minimum Ratio | Recommended |
|---------|---------------|-------------|
| Normal text | 4.5:1 | 7:1 |
| Large text | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |

**Tools to check contrast:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools accessibility panel
- Stark plugin for Figma/Sketch

### Color Selection

**Primary Color:**
- Use your institution's primary brand color
- Should work well for buttons and interactive elements
- Test both light and dark variants

**Secondary Color:**
- Complements primary color
- Used for accents and highlights
- Good for the campfire flames in the logo

**Background Colors:**
- Light: Off-white or very light gray (#f8fafc, #fafafa)
- Dark: Deep gray or near-black (#0f172a, #0a0a0a)
- Avoid pure white (#ffffff) and pure black (#000000)

### Typography

**Font Families:**
- Use system fonts for performance
- Inter is a good neutral choice
- Consider your institution's brand fonts
- Ensure good readability at all sizes

**Font Sizes:**
- Base: 16px (browser default)
- Scale up by 1.25x for headings
- Minimum 14px for body text
- Test on mobile devices

### Assets

**Logo Guidelines:**
- SVG format for scalability
- Works at 16px (favicon) to 512px (app icon)
- Simplified version for small sizes
- Transparent background preferred

**Logo Sizes:**
- Favicon: 16x16, 32x32
- App icon: 192x192, 512x512
- Header logo: 40-60px height
- Hero logo: 120-200px height

**Favicon:**
- Multi-resolution .ico file
- Include 16x16 and 32x32 at minimum
- Test in browser tabs and bookmarks

**Hero Background:**
- SVG for simple patterns
- JPG/PNG for photos
- Keep file size under 500KB
- Consider dark overlay for text readability

## UCSC Theme Example

The UCSC theme uses official university colors:

```typescript
// UCSC Official Colors
const UCSC_BLUE = '#003c6c';
const UCSC_GOLD = '#fdc700';
const UCSC_LIGHT_BLUE = '#006aad';

// Applied to theme
primary: UCSC_BLUE,
secondary: UCSC_GOLD,
```

See `src/config/branding.ts` for the complete UCSC theme configuration.

## Locking Themes

For institutional branding, you may want to lock the theme:

```typescript
colors: {
  enableDarkMode: true,        // Allow light/dark toggle
  allowThemeSwitching: false,  // Prevent changing to other themes
  defaultMode: 'system',       // Respect system preference
  // ... colors
}
```

When `allowThemeSwitching: false`:
- Theme selector is hidden
- Users can only toggle light/dark mode
- Your branding remains consistent

## Testing Your Brand

### Visual Testing

1. **Check all screens:**
   - Story library
   - Story start screen
   - Video player
   - Choice overlay
   - End screen

2. **Check all states:**
   - Loading
   - Error
   - Empty
   - Hover/focus

3. **Check all themes:**
   - Light mode
   - Dark mode
   - Both with your colors

### Accessibility Testing

1. **Color contrast:**
   - Use automated tools (axe, Lighthouse)
   - Manually check important text
   - Test with color blindness simulators

2. **Keyboard navigation:**
   - Tab through all interactive elements
   - Ensure focus indicators are visible
   - Test keyboard shortcuts

3. **Screen readers:**
   - Test with NVDA (Windows)
   - Test with VoiceOver (macOS)
   - Check heading hierarchy

### Cross-Browser Testing

Test your branded app in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Chrome (iOS/Android)
- Mobile Safari (iOS)

## Common Issues

### Colors Look Wrong

**Issue:** Colors don't match your brand

**Solution:**
- Check hex codes are correct
- Verify CSS variables are applied
- Check for typos in config
- Clear browser cache

### Logo Not Showing

**Issue:** Logo 404 error or not displaying

**Solution:**
- Verify file exists in `public/branding/`
- Check file path in config matches exactly
- Ensure SVG is valid
- Check browser console for errors

### Theme Switching Not Working

**Issue:** Users can't switch themes

**Solution:**
- Check `allowThemeSwitching: true` in config
- Verify ThemeToggle component is rendered
- Check for JavaScript errors
- Ensure localStorage is available

### Contrast Issues

**Issue:** Text is hard to read

**Solution:**
- Adjust textMuted color to be lighter/darker
- Increase border opacity
- Use contrast checker tool
- Test with actual users

## Deployment Checklist

Before deploying your branded version:

- [ ] All brand colors configured
- [ ] Logo displays correctly at all sizes
- [ ] Favicon works in browser
- [ ] Typography is readable
- [ ] Theme lock set as desired
- [ ] Color contrast meets WCAG AA
- [ ] All links work
- [ ] Mobile experience tested
- [ ] Documentation updated
- [ ] License file appropriate

## Getting Help

If you need assistance with branding:

1. Check the [Theme System Documentation](themes.md)
2. Review example themes in `src/config/branding.ts`
3. Test with accessibility tools
4. Ask for feedback from users

## Examples

### University Theme

```typescript
{
  id: 'university',
  name: 'University Theme',
  colors: {
    primary: '#002855',
    secondary: '#bf0d3e',
    // ...
  },
  // ...
}
```

### K-12 School Theme

```typescript
{
  id: 'k12-school',
  name: 'K-12 Theme',
  colors: {
    primary: '#2e7d32',
    secondary: '#f57c00',
    // ...
  },
  // ...
}
```

### Corporate Training Theme

```typescript
{
  id: 'corporate',
  name: 'Corporate Theme',
  colors: {
    primary: '#1565c0',
    secondary: '#424242',
    // ...
  },
  // ...
}
```

---

Happy branding! 🎨
