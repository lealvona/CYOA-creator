# Implementation Plan: Happy Island — Feature Roadmap

> **Status:** Planned | **Last Updated:** 2026-03-03

This document outlines the implementation plan for all 8 feature extensions to the Happy Island interactive video story player.

---

## Recommended Implementation Order

Based on dependencies and foundational impact:

| Phase | Feature | Rationale |
|-------|---------|-----------|
| **1** | Testing (Feature 8) | Foundation — validates existing code before changes |
| **2** | During-Video Choices (Feature 1) | Core UX — partially scaffolded, highest user impact |
| **3** | Save/Resume Enhancement (Feature 2) | Core UX — already partially implemented, small delta |
| **4** | Accessibility (Feature 5) | Cross-cutting — easier to build into new code early |
| **5** | Multi-Story Support (Feature 3) | Infrastructure — enhances StoryLibrary |
| **6** | Mobile/Touch (Feature 6) | UX polish — depends on stable component structure |
| **7** | Analytics/Heatmap (Feature 4) | Data layer — depends on stable engine events |
| **8** | Video Transitions (Feature 7) | Visual polish — most invasive, do last |

**Total Estimated Effort:** ~16-22 days

---

## Phase 1: Testing Coverage Expansion

**Goal:** Establish a safety net before modifying any code.

### 1.1 — StoryEngine Unit Tests
**File:** `src/engine/StoryEngine.test.ts` (extend existing 138-line file)

New test cases:
- **`load()` from URL:** Mock `fetch`, verify phase transitions `loading` -> `start_screen`
- **`load()` failure:** Mock 404, verify phase -> `error` with message
- **`load()` invalid JSON:** Verify `assertStoryValid` rejection propagates
- **`start()` without load:** Verify error phase
- **`choose()` invalid choice ID:** Returns `false`, state unchanged
- **`choose()` with unmet condition:** Returns `false`, logs warning
- **`videoEnded()` on ending node:** Phase -> `ended`, emits `storyEnd`
- **`videoEnded()` on video node:** Phase -> `choosing`
- **`videoEnded()` when not playing:** No-op
- **`enterNode()` with `setsFlags`:** Verify flags accumulate across multiple nodes
- **`goBack()` with empty history:** Returns `false`
- **`restart()` clears history and flags:** Verify clean slate
- **Event emission order:** `nodeExit` -> `nodeEnter` -> `stateChange` sequence
- **Duplicate node ID handling:** Later definition wins (warn logged)

### 1.2 — validateStory Unit Tests
**File:** `src/utils/validateStory.test.ts` (new)

Test cases:
- Valid story passes
- Missing `meta.title` → error
- Missing `config.videoBasePath` → error
- Missing `startNodeId` → error
- Empty nodes array → error
- Duplicate node IDs → error
- Start node not found → error
- Start node wrong type → error
- Broken choice `targetNodeId` → error
- Ending node with choices → warning
- Video node without choices → warning
- Orphaned nodes (unreachable from start) → warning
- No ending node → warning
- Duplicate choice IDs → warning
- Choice missing `label` → error

### 1.3 — ChoiceOverlay Component Tests
**File:** `src/components/ChoiceOverlay.test.tsx` (new)

Test cases:
- Renders all choice buttons with labels
- Renders numbered badges (1, 2, 3...)
- Renders prompt text (default "What do you do?")
- Renders custom prompt
- Calls `onChoose` with correct choice ID after click
- Anti-double-click: second click is ignored (disabled state)
- Selected button gets `--selected` class
- Non-selected buttons get `--dimmed` class

### 1.4 — StartScreen Component Tests
**File:** `src/components/StartScreen.test.tsx` (new)

Test cases:
- Renders story title, description, author
- Renders estimated duration when present
- Renders tags when present
- "Begin Story" button calls `onStart`
- "Continue" button rendered when `canResume` is true
- "Continue" button hidden when `canResume` is false
- `onResume` called when "Continue" clicked

### 1.5 — Integration Test: Full Playback Flow
**File:** `src/components/StoryViewer.integration.test.tsx` (new)

Uses real `StoryEngine` (no mocks), mock `VideoPlayer`:
- Load sample story → start screen renders
- Click "Begin" → video player renders for `intro` node
- Simulate `videoEnded` → choice overlay appears
- Click choice → next node loads
- Navigate to ending → EndScreen renders with stats
- Verify history length matches expected path

---

## Phase 2: During-Video Choices

**Goal:** Make `choiceTiming: "during_video"` fully functional in the UI.

### Current State
- `StoryViewer.tsx:26-58` — `filterTimedChoices()` already handles the `during_video` case by filtering choices where `currentTime >= showAtTime`
- `VideoPlayer.tsx:93-98` — `onTimeUpdate` callback already fires with `(currentTime, duration)`
- `StoryViewer.tsx:80-82` — State for `playbackTime`, `duration`, `isPlaying` already exists
- `StoryViewer.tsx:97-118` — `visibleChoices` memo already includes during-video filtering

**What's missing:** The `ChoiceOverlay` always shows a full-screen modal with dark backdrop. During-video choices need a non-blocking variant.

### 2.1 — ChoiceOverlay Variant: Inline Mode
**File:** `src/components/ChoiceOverlay.tsx` + `ChoiceOverlay.css`

Changes:
- Add `variant?: "modal" | "inline"` prop (default `"modal"`)
- When `variant="inline"`:
  - No backdrop (transparent)
  - Position buttons at bottom-right of video, above controls
  - Smaller button styling, semi-transparent background
  - No prompt text (or smaller, subtle prompt)
  - Fade in/out as choices appear/disappear
- CSS class: `.choice-overlay--inline` with appropriate overrides

### 2.2 — StoryViewer: Pass Variant Based on Timing
**File:** `src/components/StoryViewer.tsx`

Changes at line 259-261:
```tsx
<ChoiceOverlay
  choices={visibleChoices}
  onChoose={choose}
  variant={state.phase === "choosing" ? "modal" : "inline"}
/>
```

### 2.3 — Handle "No Choice Before Video Ends"
**File:** `src/engine/StoryEngine.ts`

In `videoEnded()` (line 274-287):
- Currently transitions to `choosing` if there are choices
- If `choiceTiming === "during_video"` and the user didn't choose, this is correct — the full modal overlay appears after video ends
- **No engine changes needed** — the existing behavior is the right fallback

### 2.4 — Update Sample Story
**File:** `public/stories/sample/story.json`

Add `choiceTiming: "during_video"` and `showAtTime` values to one or two nodes (e.g., `hallway`) so the feature is testable with the bundled sample.

### 2.5 — Tests
- Unit test: `filterTimedChoices` with `during_video` timing
- Component test: ChoiceOverlay with `variant="inline"` renders correctly
- Integration test: choices appear during playback at correct time

---

## Phase 3: Save/Resume Progress Enhancement

**Goal:** Harden the existing localStorage persistence.

### Current State
Already implemented in `StoryViewer.tsx:125-164`:
- Saves `StoryProgressSnapshot` on every `playing` phase
- Clears on `ended` phase
- Reads on `start_screen` phase, shows "Continue" button
- Key pattern: `cyoa-progress:{title}::{version}` or fallback to URL

### 3.1 — Key by Story ID + Version (Stale Save Invalidation)
**File:** `src/engine/StoryEngine.ts`

The `storyKey` getter (line 114-117) already uses `{title}::{version}`. This is correct but could be fragile if title changes. Enhancement:
- Add an optional `id` field to `StoryMeta` type
- Prefer `{meta.id}::{meta.version}` when `id` exists, fall back to title

**File:** `src/types/story.ts`
- Add `id?: string` to `StoryMeta` interface (line 114)

**File:** `src/engine/StoryEngine.ts`
- Update `storyKey` getter: `this._meta.id ?? this._meta.title` + `::` + `this._meta.version`

### 3.2 — Serialize on Every State Change (Not Just `playing`)
**File:** `src/components/StoryViewer.tsx`

Currently saves only when `phase === "playing"` (line 140). Should also save on `choosing` phase to preserve exact position if user closes mid-choice:

```tsx
if (state.phase === "playing" || state.phase === "choosing") {
  const snapshot = engine.createProgressSnapshot();
  // ...save
}
```

### 3.3 — Serialize Flags in Snapshot
Already handled — `createProgressSnapshot()` at `StoryEngine.ts:356-367` converts `Set<string>` to `string[]`, and `loadProgressSnapshot()` at line 385 reconstructs it as `new Set(snapshot.flags)`.

### 3.4 — Robustness Improvements
**File:** `src/components/StoryViewer.tsx`

- Wrap `localStorage.setItem` in try/catch (storage quota exceeded)
- Add a `schemaVersion` field to `StoryProgressSnapshot` for future-proofing
- Validate snapshot shape more thoroughly before loading (check `storyKey`, `currentNodeId` exist)

---

## Phase 4: Accessibility Improvements

**Goal:** WCAG 2.1 AA compliance for the web player.

### 4.1 — Screen Reader Announcements for Phase Transitions
**File:** `src/components/StoryViewer.tsx`

Add a visually hidden ARIA live region:
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announceText}
</div>
```

Update `announceText` on phase transitions:
- `start_screen` → "Story loaded: {title}. Press Begin to start."
- `playing` → "Now playing: {node.title}"
- `choosing` → "Make a choice. {count} options available."
- `ended` → "Story complete: {endingNode.title}"
- `error` → "Error: {message}"

**File:** `src/index.css` — Add `.sr-only` utility class:
```css
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px;
  padding: 0; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
```

### 4.2 — Subtitle / Closed Caption Support (WebVTT)
**File:** `src/types/story.ts`

Add to `StoryNode`:
```ts
captionFile?: string;  // e.g., "intro.vtt"
```

Add to `StoryConfig`:
```ts
captionBasePath?: string;  // defaults to videoBasePath
```

**File:** `src/components/VideoPlayer.tsx`

Add `<track>` element inside `<video>`:
```tsx
{node.captionFile && (
  <track kind="captions" src={captionUrl} srclang="en" label="English" default />
)}
```

Add caption toggle button to controls bar.

### 4.3 — Reduced Motion Mode
**File:** `src/index.css`

Add global `prefers-reduced-motion` media query:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

This disables:
- `ChoiceOverlay.css` button slide-in animations
- `StoryViewer.css` transition fade
- `VideoPlayer.css` spinner rotation
- `StartScreen.css` floating circles

### 4.4 — High Contrast Mode
**File:** `src/index.css`

Add `forced-colors` / `prefers-contrast: high` support:
```css
@media (prefers-contrast: high) {
  .choice-overlay__btn {
    border: 2px solid #fff;
    background: #000;
  }
  .video-player__controls {
    background: #000;
  }
  /* Additional overrides for translucent backgrounds */
}
```

### 4.5 — Focus Management
**File:** `src/components/ChoiceOverlay.tsx`

- Auto-focus first choice button when overlay appears (`useEffect` + `ref.focus()`)
- Trap focus within overlay (Tab cycles through buttons only)
- Escape key dismisses nothing (choices are mandatory)

**File:** `src/components/StartScreen.tsx`
- Auto-focus "Begin Story" button on mount

---

## Phase 5: Multi-Story Support (Enhance StoryLibrary)

**Goal:** Support multiple stories with metadata, thumbnails, and filtering.

### 5.1 — Create Story Index File
**File:** `public/stories/index.json` (new)

```json
{
  "stories": [
    {
      "id": "sample",
      "storyUrl": "/stories/sample/story.json",
      "thumbnail": "/stories/sample/thumbnail.jpg",
      "completeness": "complete"
    }
  ]
}
```

### 5.2 — API Endpoint for Story Index
**File:** `server/index.mjs`

Add `GET /api/stories/index` that:
- Reads `public/stories/index.json` for bundled stories
- Merges with imported stories from catalog
- Returns unified list with metadata

Alternatively, enhance existing `GET /api/stories` to merge both sources.

### 5.3 — Enhance StoryLibrary Component
**File:** `src/components/StoryLibrary.tsx`

Changes:
- Fetch from both `/api/stories` (imported) and `/stories/index.json` (bundled)
- Merge and dedupe by ID
- Add search/filter bar (by title, author, tags)
- Display thumbnail images when available
- Show story duration, tag pills, completeness badge
- Grid layout with responsive cards

**File:** `src/components/StoryLibrary.css`
- Card with thumbnail, hover effects
- Search bar styling
- Grid responsive breakpoints

### 5.4 — Update storyApi.ts
**File:** `src/utils/storyApi.ts`

Add `fetchStoryIndex()` function to load `index.json` and merge with catalog.

### 5.5 — StoryMeta Thumbnail Support
**File:** `src/types/story.ts`

`thumbnail` already exists as optional on `StoryMeta` (line 131). No type change needed.

---

## Phase 6: Mobile / Touch Optimization

**Goal:** First-class mobile playback experience.

### 6.1 — Tap to Show/Hide Controls
**File:** `src/components/VideoPlayer.tsx` + `VideoPlayer.css`

Currently controls show on hover (CSS `.video-player:hover .video-player__controls`). Changes:
- Add `onClick` handler on the video player container
- Toggle a `controls-visible` state class
- Auto-hide after 3 seconds of inactivity
- Replace CSS `:hover` with `.video-player--controls-visible` class
- Use `@media (hover: hover)` to preserve hover behavior on desktop

### 6.2 — Swipe Gestures for Back Navigation
**File:** `src/components/StoryViewer.tsx`

Add touch event handling:
- Track `touchstart` / `touchend` X coordinates
- Right swipe (deltaX > 80px) triggers `goBack()` if `allowRevisit`
- Add visual feedback (slight page slide animation)
- Only activate when no choice overlay is visible

### 6.3 — Fullscreen API Integration
**File:** `src/components/VideoPlayer.tsx`

Add fullscreen toggle button to controls:
```tsx
<button onClick={toggleFullscreen} aria-label="Fullscreen">
  {isFullscreen ? "Exit" : "Fullscreen"}
</button>
```

Use `document.documentElement.requestFullscreen()` / `exitFullscreen()`.

**File:** `src/components/StoryViewer.tsx`
- Wrap viewer in a ref for fullscreen target
- Listen to `fullscreenchange` event for state sync

### 6.4 — Orientation Lock
**File:** `src/components/StoryViewer.tsx`

When entering fullscreen on mobile:
```ts
screen.orientation?.lock("landscape").catch(() => {});
```

Unlock on exit.

### 6.5 — Touch-Friendly Sizing
**File:** `src/components/ChoiceOverlay.css`

- Ensure buttons are at least 48x48px touch targets (already ~48px height via padding)
- Add `@media (pointer: coarse)` for larger touch targets

**File:** `src/components/VideoPlayer.css`
- Increase control button size on touch devices

---

## Phase 7: Analytics / Heatmap

**Goal:** Track choice popularity; show summary on EndScreen + detailed dashboard from StoryLibrary.

### 7.1 — Analytics Data Model
**File:** `src/types/analytics.ts` (new)

```ts
export interface ChoiceEvent {
  storyKey: string;
  nodeId: string;
  choiceId: string;
  timestamp: number;
}

export interface PlaythroughRecord {
  storyKey: string;
  path: string[];        // ordered node IDs
  endingNodeId: string;
  startedAt: number;
  endedAt: number;
}

export interface StoryAnalytics {
  storyKey: string;
  totalPlaythroughs: number;
  choiceCounts: Record<string, Record<string, number>>;  // nodeId -> choiceId -> count
  endingCounts: Record<string, number>;                   // endingNodeId -> count
  playthroughs: PlaythroughRecord[];
}
```

### 7.2 — Analytics Collector Service
**File:** `src/utils/analyticsCollector.ts` (new)

Framework-agnostic singleton:
- Listens to `StoryEngine` events: `choiceMade`, `storyEnd`, `nodeEnter`
- Accumulates choice counts per node
- Stores in localStorage under `cyoa-analytics:{storyKey}`
- Methods: `getAnalytics(storyKey)`, `recordChoice(...)`, `recordPlaythrough(...)`
- Optional: `sendToEndpoint(url)` for remote analytics

### 7.3 — Hook into Engine Events
**File:** `src/hooks/useStoryEngine.ts`

In the `useEffect` that subscribes to engine events, also initialize the analytics collector:
```ts
const unsubChoiceMade = engine.on("choiceMade", (event) => {
  analyticsCollector.recordChoice(engine.storyKey, event.payload);
});
const unsubStoryEnd = engine.on("storyEnd", (event) => {
  analyticsCollector.recordPlaythrough(engine.storyKey, engine.history, event.payload);
});
```

### 7.4 — EndScreen Summary (Inline Analytics)
**File:** `src/components/EndScreen.tsx`

Add below existing stats:
- "Most popular choice at {nodeName}: {choiceLabel} ({pct}%)"
- "This ending was reached by {n} of your playthroughs"
- Show a mini path comparison: your path vs. most common path

### 7.5 — Analytics Dashboard Component
**File:** `src/components/AnalyticsDashboard.tsx` (new)

Accessible from StoryLibrary via "View Analytics" button per story:
- Bar chart showing choice distribution per node
- Ending distribution pie/donut chart (CSS-only or simple SVG)
- Path heatmap: highlight most/least traversed edges
- Total playthroughs counter
- "Clear Analytics" button

### 7.6 — Integrate Dashboard into App
**File:** `src/App.tsx`

Add a third state: `view: "library" | "viewer" | "analytics"`:
```tsx
const [view, setView] = useState<"library" | "viewer" | "analytics">("library");
const [activeStory, setActiveStory] = useState<StoryCatalogItem | null>(null);
```

Route to `AnalyticsDashboard` when `view === "analytics"`.

---

## Phase 8: Video Transition Effects

**Goal:** Crossfade and configurable transitions between scenes.

### 8.1 — Type Extensions
**File:** `src/types/story.ts`

Add to `StoryNode`:
```ts
transition?: {
  type: "cut" | "crossfade" | "fade-black" | "fade-white";
  durationMs?: number;  // default 500
};
```

Add to `StoryConfig`:
```ts
defaultTransition?: StoryNode["transition"];
```

### 8.2 — VideoTransitionLayer Component (New Wrapper)
**File:** `src/components/VideoTransitionLayer.tsx` (new)
**File:** `src/components/VideoTransitionLayer.css` (new)

Architecture:
- Renders two stacked `<VideoPlayer>` instances: `front` (current) and `back` (incoming)
- On node change:
  1. `back` starts loading the new video
  2. When `back` fires `onCanPlay`, begin transition
  3. **Crossfade:** Animate `front` opacity 1→0, `back` opacity 0→1 over `durationMs`
  4. **Fade-black:** `front` opacity 1→0, black gap, `back` opacity 0→1
  5. **Cut:** Instant swap (current behavior)
  6. After transition, swap roles: `back` becomes `front`

Props mirror `VideoPlayer` props plus:
```ts
transition?: { type: string; durationMs?: number };
onTransitionComplete?: () => void;
```

### 8.3 — Integrate into StoryViewer
**File:** `src/components/StoryViewer.tsx`

Replace `<VideoPlayer key={...} />` with `<VideoTransitionLayer>`:
```tsx
<VideoTransitionLayer
  node={state.currentNode}
  videoUrl={videoUrl}
  transition={state.currentNode.transition ?? config?.defaultTransition ?? { type: "cut" }}
  onEnded={videoEnded}
  onTimeUpdate={...}
  onPlaybackStateChange={...}
  preloadUrls={preloadUrls}
  volume={config?.defaultVolume ?? 1}
/>
```

Remove the `key={state.currentNode.id}` pattern (the transition layer manages its own lifecycle).

### 8.4 — Theme-Driven Transitions
**File:** `src/components/VideoTransitionLayer.tsx`

If `node.theme` is set, apply it as a CSS custom property or class on the transition container:
```tsx
<div className="transition-layer" data-theme={node.theme}>
```

Theme can drive transition overlay color, timing, or filter effects via CSS.

### 8.5 — Update Sample Story
Add `transition` fields to a few nodes in `public/stories/sample/story.json` to demo crossfade.

---

## Known Limitations (From Original Spec)

- Android creator is a production-grade scaffold, but CameraX capture UI and full export wizard still require final implementation polish.
- No SSR for web player; frontend is SPA.
- No authenticated multi-user cloud sync yet (local replay progress is supported in browser).
- Autoplay may be blocked by browser policy until user interaction.

---

## Key Architectural Decisions

1. **No new dependencies required** for phases 1-6. All use built-in browser APIs + existing stack.
2. **Analytics (Phase 7)** — localStorage-only by default; optional remote endpoint. No charting library — CSS/SVG-based visualizations to stay lightweight.
3. **Transitions (Phase 8)** — New wrapper component, not in-place refactor. Preserves `VideoPlayer` as a simple, testable unit.
4. **Accessibility (Phase 4)** — Uses `prefers-reduced-motion` and `prefers-contrast` media queries; no runtime settings needed.
5. **No React Router** — Continue using component state for routing. The `view` state in `App.tsx` is sufficient for library/viewer/analytics navigation.
