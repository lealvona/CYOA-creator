# Implementation Plan: Branding, Documentation & Polish

## Project: Interactive Video Story Engine

---

## Phase 1: Branding & Assets Isolation
**Branch:** `feature/branding-placeholders`

### 1.1 Create Brand Configuration System

**File:** `src/config/branding.ts`

Create a comprehensive brand configuration file that includes:

```typescript
export interface BrandConfig {
  colors: BrandTheme;      // Light/dark mode colors
  typography: BrandTypography;
  assets: BrandAssets;     // Logo, favicon, icons
  meta: BrandMeta;         // App name, tagline, org info
}
```

**Key Features:**
- Default brand config matching current styling
- Educational institution template (commented example)
- CSS custom property generator function
- Type-safe configuration with full TypeScript interfaces

### 1.2 Create Brand Assets Directory

**Directory:** `public/branding/`

Create placeholder assets:

1. **logo.svg** - SVG logo placeholder with your org name
2. **favicon.ico** - Favicon placeholder  
3. **app-icon.png** - PWA app icon placeholder
4. **hero-bg.svg** - Hero background placeholder

### 1.3 Create Theme Context Provider

**Files:**
- `src/contexts/ThemeContext.tsx` - React context for theme management
- `src/hooks/useTheme.ts` - Hook for consuming theme

**Features:**
- Light/Dark/System mode toggle
- localStorage persistence
- System preference detection
- CSS class injection

### 1.4 Update Components for Branding

**Files to modify:**
- `src/index.css` - Add brand CSS custom properties
- `src/components/StartScreen.tsx` - Use brand assets
- `src/components/StoryLibrary.tsx` - Add theme toggle
- `index.html` - Update favicon and meta tags

### 1.5 Create Brand CSS Variables

**File:** `src/styles/brand-variables.css`

Generated from brand config, includes:
- Color variables for all brand colors
- Typography variables
- Asset URLs
- Dark mode overrides

---

## Phase 2: Documentation Restructure
**Branch:** `feature/docs-restructure`

### 2.1 Create Documentation Structure

```
docs/
├── README.md                    # Docs index
├── quickstart.md               # Quick start guide
├── architecture.md             # System architecture
├── story-format.md             # Story JSON format
├── api-reference.md            # Engine API docs
├── components.md               # Component reference
├── android-creator/
│   └── README.md              # Move from root
├── contributing.md             # Contribution guidelines
└── branding.md                 # Brand customization guide
```

### 2.2 Move Android Creator Documentation

**Source:** Root README sections on Android Creator
**Destination:** `android-creator/README.md`

Extract and organize:
- Setup instructions
- Feature overview
- Build commands
- Architecture notes

### 2.3 Rewrite Root README

New structure:
```markdown
# Interactive Story Engine

[Hero image/animation]

## One-Line Value Prop
Create immersive, branching video stories that engage and educate.

## Quick Start (3 steps)
1. Install: `npm install`
2. Run: `npm run dev:all`
3. Open: http://localhost:5173

## Features
- [x] Branching narratives
- [x] Video playback
- [x] Flag-based conditions
- [x] Progress persistence
- [x] ZIP import/export
- [x] Android creator app

## Tech Stack
React + TypeScript + Vite + Express + Kotlin

## Documentation
- [Quick Start](docs/quickstart.md)
- [Architecture](docs/architecture.md)
- [Story Format](docs/story-format.md)
- [Full Docs](docs/)

## Educational Use
This project is dual-licensed for educational institutions.
```

### 2.4 Create Branding Documentation

**File:** `docs/branding.md`

Document:
- How to customize brand colors
- How to replace logo and assets
- Educational institution best practices
- Theme customization

---

## Phase 3: Polish & Dark Mode
**Branch:** `feature/polish-dark-mode`

### 3.1 Theme Toggle Component

**File:** `src/components/ThemeToggle.tsx`

Features:
- Sun/Moon icon toggle
- Dropdown for Light/Dark/System
- Smooth transition animation
- Keyboard accessible

### 3.2 Enhanced Progress Persistence

**File:** `src/hooks/useStoryProgress.ts`

Improvements:
- Auto-save on every state change
- Expire old saves (30 days)
- Export/import progress
- Multiple story slots

### 3.3 Keyboard Shortcuts Modal

**File:** `src/components/KeyboardShortcuts.tsx`

Shortcuts to document:
- `Space` - Play/Pause
- `←/→` - Seek
- `M` - Mute
- `F` - Fullscreen
- `?` - Show shortcuts
- `Esc` - Close modal/back

### 3.4 Loading States & Animations

**File:** `src/components/LoadingSpinner.tsx`

- Brand-customizable spinner
- Skeleton screens for cards
- Smooth transitions between states

### 3.5 Error Boundary

**File:** `src/components/ErrorBoundary.tsx`

Features:
- Friendly error messages
- "Try again" button
- Error reporting (optional)
- Recovery suggestions

### 3.6 Update All Component Styles

Ensure all components work with:
- Light mode
- Dark mode
- Brand color variables
- Proper contrast ratios

---

## Phase 4: Final Integration
**Branch:** `main`

### 4.1 Merge All PRs
1. Merge `feature/branding-placeholders`
2. Merge `feature/docs-restructure`
3. Merge `feature/polish-dark-mode`

### 4.2 Final Verification
- Run `npm run lint`
- Run `npm run test`
- Run `npm run build`
- Test in both light/dark modes
- Verify all branding assets load

### 4.3 Create Summary PR
Document all changes made across the three feature branches.

---

## File Inventory

### New Files (Phase 1)
- `src/config/branding.ts`
- `src/contexts/ThemeContext.tsx`
- `src/hooks/useTheme.ts`
- `src/styles/brand-variables.css`
- `public/branding/logo.svg`
- `public/branding/favicon.ico`
- `public/branding/app-icon.png`
- `public/branding/hero-bg.svg`

### New Files (Phase 2)
- `docs/README.md`
- `docs/quickstart.md`
- `docs/architecture.md`
- `docs/story-format.md`
- `docs/api-reference.md`
- `docs/components.md`
- `docs/contributing.md`
- `docs/branding.md`
- `android-creator/README.md`

### New Files (Phase 3)
- `src/components/ThemeToggle.tsx`
- `src/components/ThemeToggle.css`
- `src/hooks/useStoryProgress.ts`
- `src/components/KeyboardShortcuts.tsx`
- `src/components/LoadingSpinner.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/contexts/ProgressContext.tsx`

### Modified Files
- `src/index.css`
- `src/components/StartScreen.tsx`
- `src/components/StartScreen.css`
- `src/components/StoryLibrary.tsx`
- `src/components/StoryLibrary.css`
- `src/components/StoryViewer.tsx`
- `src/App.tsx`
- `src/main.tsx`
- `index.html`
- `README.md`

---

## Implementation Order

1. ✅ Pull latest changes
2. ✅ Create branch `feature/branding-placeholders`
3. [ ] Create brand config system
4. [ ] Create brand assets
5. [ ] Create theme context
6. [ ] Update components
7. [ ] Commit & PR
8. [ ] Create branch `feature/docs-restructure`
9. [ ] Create docs structure
10. [ ] Move Android docs
11. [ ] Rewrite README
12. [ ] Commit & PR
13. [ ] Create branch `feature/polish-dark-mode`
14. [ ] Add theme toggle
15. [ ] Enhance persistence
16. [ ] Add keyboard shortcuts
17. [ ] Add loading states
18. [ ] Add error boundary
19. [ ] Commit & PR
20. [ ] Final integration

---

## Best Practices for Educational Institutions

### Brand Customization
1. **Fork the repository** before customizing
2. **Create a custom brand config** in `src/config/branding.custom.ts`
3. **Replace placeholder assets** in `public/branding/`
4. **Test accessibility** with your brand colors
5. **Document your changes** for future maintainers

### Color Contrast
- Ensure 4.5:1 contrast ratio for text
- Use the provided color contrast checker
- Test with color blindness simulators

### Accessibility
- Maintain keyboard navigation
- Use semantic HTML
- Provide alt text for images
- Test with screen readers

### Deployment
- Use your institution's CI/CD pipeline
- Set up automated testing
- Configure proper error monitoring
- Document deployment procedures

---

## Estimated Timeline

- Phase 1: 2-3 hours
- Phase 2: 1.5-2 hours
- Phase 3: 2-3 hours
- Phase 4: 30 minutes
- **Total: 6-8.5 hours**

---

## Dependencies

No new npm packages required. All features use:
- React 19 built-in features
- CSS custom properties
- localStorage API
- Native browser APIs
