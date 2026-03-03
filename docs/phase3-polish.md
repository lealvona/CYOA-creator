# Phase 3: Polish & Dark Mode

## Overview

This phase adds the theme toggle UI, enhances progress persistence, adds keyboard shortcuts, improves loading states, and creates an error boundary for better user experience.

## Branch
`feature/polish-dark-mode`

## Implementation Steps

### Step 3.1: Create Theme Toggle Component

**File**: `src/components/ThemeToggle.tsx`

Features:
- Dropdown selector with all themes
- Theme preview icons/colors
- Mode selector (Light/Dark/System)
- Keyboard accessible
- Respects theme lock setting

```typescript
interface ThemeToggleProps {
  variant?: 'dropdown' | 'button' | 'minimal';
  showModeSelector?: boolean;
}
```

**File**: `src/components/ThemeToggle.css`

Styling:
- Smooth dropdown animation
- Theme preview swatches
- Hover/focus states
- Mobile-responsive

### Step 3.2: Enhance Progress Persistence

**File**: `src/hooks/useStoryProgress.ts`

Features:
- Auto-save on every state change
- 30-day expiration for old saves
- Export progress to JSON
- Import progress from JSON
- Multiple story slots
- Progress statistics

```typescript
interface ProgressSlot {
  storyId: string;
  storyName: string;
  timestamp: number;
  progress: StoryProgressSnapshot;
}

interface UseStoryProgressReturn {
  saveProgress: (snapshot: StoryProgressSnapshot) => void;
  loadProgress: (storyId: string) => StoryProgressSnapshot | null;
  exportProgress: () => string;  // JSON string
  importProgress: (json: string) => boolean;
  deleteProgress: (storyId: string) => void;
  slots: ProgressSlot[];
  clearOldProgress: () => void;
}
```

### Step 3.3: Create Progress Context

**File**: `src/contexts/ProgressContext.tsx`

Global progress state management:
- Automatic saving on story progress
- Cleanup of expired saves
- Cross-component access

### Step 3.4: Create Keyboard Shortcuts System

**File**: `src/components/KeyboardShortcuts.tsx`

Modal component showing all available shortcuts:

```typescript
const SHORTCUTS = [
  { key: 'Space', action: 'Play/Pause video', context: 'Video Player' },
  { key: '←', action: 'Seek backward 10s', context: 'Video Player' },
  { key: '→', action: 'Seek forward 10s', context: 'Video Player' },
  { key: 'M', action: 'Toggle mute', context: 'Video Player' },
  { key: 'F', action: 'Toggle fullscreen', context: 'Video Player' },
  { key: '1-9', action: 'Select choice N', context: 'Choice Overlay' },
  { key: 'Escape', action: 'Close modal / Go back', context: 'Global' },
  { key: '?', action: 'Show this help', context: 'Global' },
  { key: 'R', action: 'Restart story', context: 'Story Viewer' },
];
```

**Implementation**:
- Global keyboard listener in App.tsx
- Prevent default for handled keys
- Context-aware shortcuts (only active when relevant)
- Visual indicator when shortcut used

### Step 3.5: Create Loading States

**File**: `src/components/LoadingSpinner.tsx`

Features:
- Brand-customizable animation
- Multiple sizes (sm, md, lg, xl)
- Optional text label
- Accessible (aria-live)

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullscreen?: boolean;
}
```

**File**: `src/components/SkeletonCard.tsx`

Skeleton loading for StoryLibrary cards:
- Pulsing placeholder
- Matches card dimensions
- Reduces layout shift

### Step 3.6: Create Error Boundary

**File**: `src/components/ErrorBoundary.tsx`

Features:
- Catches React errors
- Friendly error messages
- Recovery suggestions
- "Try Again" button
- Error details (dev mode)
- Graceful degradation

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}
```

**Error Types**:
- Story load errors
- Video playback errors
- Network errors
- Unknown errors

**Recovery Options**:
- Reload story
- Go to library
- Clear cache and retry
- Report error (if configured)

### Step 3.7: Update Component Styles

Update all components for polished look:

**StartScreen.tsx/css**:
- Smooth entrance animations
- Logo entrance animation
- Staggered content reveal
- Hover effects on buttons

**StoryLibrary.tsx/css**:
- Card hover animations
- Loading skeleton states
- Better grid layout
- Theme toggle integration

**StoryViewer.tsx/css**:
- Smooth transitions between phases
- Loading overlay
- Better error display

**VideoPlayer.tsx/css**:
- Smooth control bar transitions
- Better buffering indicator
- Volume slider improvements

**ChoiceOverlay.tsx/css**:
- Staggered choice animations
- Better focus states
- Keyboard number indicators

**EndScreen.tsx/css**:
- Stats animation
- Confetti/success effects
- Better CTA buttons

### Step 3.8: Update App Entry Point

**File**: `src/App.tsx`

Changes:
- Wrap with ErrorBoundary
- Add ProgressContext provider
- Add keyboard shortcuts listener
- Better loading state

**File**: `src/main.tsx`

Changes:
- Wrap with ThemeProvider
- Initialize theme system
- Load saved preferences

### Step 3.9: Add Animations

**Global Animations**:
- Page transitions
- Theme transitions
- Modal animations
- Toast notifications

**CSS Animations**:
```css
/* Fade in */
@keyframes fadeIn { ... }

/* Slide up */
@keyframes slideUp { ... }

/* Pulse */
@keyframes pulse { ... }

/* Shake (for errors) */
@keyframes shake { ... }

/* Theme transition */
.theme-transition {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Step 3.10: Add QoL Features

**Auto-save indicator**:
- Small "Saving..." / "Saved" text
- Appears in StoryViewer

**Back button enhancement**:
- Show preview of previous node
- Keyboard shortcut (Escape)

**Fullscreen improvements**:
- Better keyboard handling
- Exit on Escape
- Maintain aspect ratio

**Toast notifications**:
- Success messages
- Error messages
- Info messages
- Auto-dismiss

### Step 3.11: Commit and Create PR

**Commit Message**:
```
feat: Add polish features, theme system, and error handling

- Create ThemeToggle component with dropdown and mode selector
- Add useStoryProgress hook with export/import functionality
- Create ProgressContext for global progress management
- Implement keyboard shortcuts system (Space, arrows, F, M, ?, etc.)
- Create LoadingSpinner and SkeletonCard components
- Add ErrorBoundary for graceful error handling
- Update all components with smooth animations
- Add page transitions and theme transitions
- Implement toast notification system
- Add auto-save indicator
- Enhance fullscreen and back button UX

New components:
- ThemeToggle.tsx/css
- LoadingSpinner.tsx
- SkeletonCard.tsx
- KeyboardShortcuts.tsx/css
- ErrorBoundary.tsx/css

New hooks:
- useStoryProgress.ts

New contexts:
- ProgressContext.tsx
```

**PR Checklist**:
- [ ] Theme toggle works correctly
- [ ] All themes display properly
- [ ] Progress persistence works
- [ ] Keyboard shortcuts function
- [ ] Loading states look good
- [ ] Error boundary catches errors
- [ ] Animations are smooth
- [ ] No performance issues
- [ ] All tests pass
- [ ] Mobile experience is good

## Feature Checklist

### Theme System
- [ ] Theme toggle dropdown
- [ ] Mode selector (Light/Dark/System)
- [ ] Theme preview in dropdown
- [ ] Respect theme lock setting
- [ ] Smooth theme transitions

### Progress Persistence
- [ ] Auto-save on state change
- [ ] localStorage persistence
- [ ] 30-day expiration
- [ ] Export to JSON
- [ ] Import from JSON
- [ ] Multiple story slots
- [ ] Progress statistics

### Keyboard Shortcuts
- [ ] Space: Play/Pause
- [ ] Arrows: Seek
- [ ] M: Mute
- [ ] F: Fullscreen
- [ ] 1-9: Select choice
- [ ] Escape: Close/Back
- [ ] ?: Show help
- [ ] R: Restart
- [ ] Context-aware activation

### Loading States
- [ ] Loading spinner component
- [ ] Skeleton cards
- [ ] Loading overlays
- [ ] Progress indicators

### Error Handling
- [ ] Error boundary
- [ ] Friendly error messages
- [ ] Recovery options
- [ ] Error logging (dev)

### Animations
- [ ] Page transitions
- [ ] Component entrance animations
- [ ] Hover effects
- [ ] Theme transitions
- [ ] Choice stagger animations

## Testing Scenarios

1. **Theme Switching**
   - Switch between all themes
   - Verify persistence
   - Test theme lock
   - Check system preference

2. **Progress Persistence**
   - Play story, close browser, reopen
   - Export and import progress
   - Test multiple story slots
   - Verify expiration cleanup

3. **Keyboard Shortcuts**
   - Test each shortcut
   - Verify context awareness
   - Test help modal
   - Ensure no conflicts

4. **Error Handling**
   - Break story JSON
   - Block network requests
   - Verify error UI
   - Test recovery flows

5. **Performance**
   - Check animation smoothness
   - Monitor memory usage
   - Test on mobile
   - Verify no jank

## Next Phase

After completing Phase 3, proceed to [Phase 4: Integration](phase4-integration.md).
