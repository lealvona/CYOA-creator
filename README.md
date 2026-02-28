# Interactive Video Story Engine

A web application for creating **choose-your-own-adventure** style interactive video experiences. Users watch video scenes and make choices that branch the narrative into different paths, leading to multiple possible endings.

Built with React, TypeScript, and Vite.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Story Definition Format](#story-definition-format)
  - [Top-Level Structure](#top-level-structure)
  - [Story Nodes](#story-nodes)
  - [Choices](#choices)
  - [Conditional Branching (Flags)](#conditional-branching-flags)
- [Video File Naming Convention](#video-file-naming-convention)
- [Creating a New Story](#creating-a-new-story)
- [CLI Tools](#cli-tools)
- [Component Reference](#component-reference)
- [Engine API Reference](#engine-api-reference)
- [Extending the Application](#extending-the-application)
- [Known Limitations & Future Work](#known-limitations--future-work)
- [Tech Stack](#tech-stack)

---

## Quick Start

```bash
# Install dependencies
npm install

# Generate placeholder videos for the sample story (requires ffmpeg)
npm run generate-placeholders

# Start the dev server
npm run dev

# Open http://localhost:5173 in your browser
```

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **ffmpeg** (optional, for generating placeholder videos)
  ```bash
  # Windows
  winget install ffmpeg
  # macOS
  brew install ffmpeg
  # Linux
  sudo apt install ffmpeg
  ```

---

## Architecture Overview

The application is a **client-side single-page application**. There is no backend — all story data and video assets are static files served from the `public/` directory.

```
                    ┌─────────────────────────────────────────┐
                    │              StoryViewer                 │
                    │  (orchestrator — renders by phase)       │
                    └──────────┬──────────┬───────────────────┘
                               │          │
          ┌────────────────────┤          ├──────────────────┐
          ▼                    ▼          ▼                  ▼
    StartScreen          VideoPlayer   ChoiceOverlay     EndScreen
                              │
                              │ events (onEnded, onTimeUpdate)
                              ▼
                    ┌──────────────────┐
                    │   useStoryEngine │ (React hook)
                    │   ┌────────────┐ │
                    │   │StoryEngine │ │ (framework-agnostic state machine)
                    │   └────────────┘ │
                    └──────────────────┘
                              │
                              │ loads
                              ▼
                    story.json (static file)
```

### Data flow

1. `App` mounts `StoryViewer` with a `storyUrl` prop pointing to a story JSON file.
2. `useStoryEngine` hook instantiates a `StoryEngine`, fetches and parses the JSON.
3. Engine indexes all nodes into a `Map<string, StoryNode>` for O(1) lookup.
4. Engine phase transitions drive which UI component renders:
   - `loading` → spinner
   - `start_screen` → `StartScreen`
   - `playing` → `VideoPlayer`
   - `choosing` → `VideoPlayer` + `ChoiceOverlay`
   - `transitioning` → brief fade animation
   - `ended` → `EndScreen`
   - `error` → error display
5. When a video ends, the engine transitions to `choosing`. When the user clicks a choice, the engine navigates to the target node and transitions back to `playing`.

---

## Project Structure

```
interactive_PPD/
├── public/
│   └── stories/
│       ├── story.schema.json          # JSON Schema for story files
│       └── sample/
│           ├── story.json             # Sample story definition
│           └── videos/                # Video files for the sample story
│               ├── intro.webm
│               ├── hallway.webm
│               └── ...
├── scripts/
│   ├── generate-placeholders.js       # Generate placeholder videos (ffmpeg)
│   └── validate-story.js             # CLI story validation tool
├── src/
│   ├── types/
│   │   └── story.ts                  # All TypeScript type definitions
│   ├── engine/
│   │   └── StoryEngine.ts            # Core state machine (framework-agnostic)
│   ├── hooks/
│   │   └── useStoryEngine.ts         # React integration hook
│   ├── components/
│   │   ├── StoryViewer.tsx + .css     # Main orchestrator component
│   │   ├── VideoPlayer.tsx + .css     # HTML5 video player
│   │   ├── ChoiceOverlay.tsx + .css   # Choice selection UI
│   │   ├── StartScreen.tsx + .css     # Title / splash screen
│   │   └── EndScreen.tsx + .css       # Ending / completion screen
│   ├── utils/
│   │   └── validateStory.ts          # Runtime story validation
│   ├── App.tsx                        # Root component
│   ├── App.css
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

---

## How It Works

### Playback Lifecycle

1. **Load** — The engine fetches `story.json`, parses it, and builds a node index.
2. **Start Screen** — User sees the story title, description, and a "Begin Story" button.
3. **Play Loop:**
   - A `<video>` element plays the current node's video file.
   - When the video ends, the engine phase shifts to `choosing`.
   - Choice buttons appear, overlaid on the last frame of the video.
   - User clicks a choice → engine navigates to the target node → next video plays.
4. **Ending** — When the engine reaches a node of type `ending`, it shows the `EndScreen` with stats and a "Play Again" button.

### Navigation Features

- **Back button** — visible on hover when history length > 1. Replays the previous node.
- **Preloading** — the next set of possible videos are preloaded via `<link rel="preload">` tags for seamless transitions.
- **Keyboard** — choice buttons are focusable and clickable via Enter/Space.

---

## Story Definition Format

Stories are defined in a single JSON file. A JSON Schema is provided at `public/stories/story.schema.json` for editor intellisense.

### Top-Level Structure

```json
{
  "meta": {
    "title": "My Story",
    "description": "A brief description",
    "author": "Author Name",
    "version": "1.0.0",
    "date": "2026-01-15",
    "estimatedMinutes": 10,
    "tags": ["adventure", "mystery"]
  },
  "config": {
    "videoBasePath": "/stories/my-story/videos",
    "preloadNext": true,
    "defaultVolume": 0.8,
    "choiceLeadTime": 0
  },
  "startNodeId": "intro",
  "nodes": [ ... ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `meta` | object | Yes | Display metadata (title, author, etc.) |
| `config` | object | Yes | Playback settings and asset paths |
| `config.videoBasePath` | string | Yes | Directory containing video files, relative to public root |
| `config.preloadNext` | boolean | No | Preload upcoming videos. Default: `true` |
| `config.defaultVolume` | number | No | Initial volume (0.0-1.0). Default: `1.0` |
| `config.choiceLeadTime` | number | No | Seconds before video end to show choices. Default: `0` |
| `startNodeId` | string | Yes | ID of the first node to play |
| `nodes` | array | Yes | All story nodes |

### Story Nodes

Each node represents one video scene in the story.

```json
{
  "id": "hallway",
  "title": "The Hallway",
  "type": "video",
  "videoFile": "hallway.webm",
  "subtitle": "A long corridor stretches ahead.",
  "choices": [ ... ],
  "choiceTiming": "on_end",
  "theme": "dark",
  "setsFlags": ["visited_hallway"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier. Used in choice targets and file naming. |
| `title` | string | Yes | Human-readable scene title |
| `type` | `"start"` \| `"video"` \| `"ending"` | Yes | Node behavior type |
| `videoFile` | string | Yes | Video filename relative to `videoBasePath` |
| `choices` | array | Yes | Available choices (empty `[]` for endings) |
| `choiceTiming` | string | No | When choices appear: `"on_end"` (default), `"during_video"`, `"on_pause"` |
| `subtitle` | string | No | Text displayed below the video during playback |
| `theme` | string | No | CSS class or color applied during this node |
| `setsFlags` | string[] | No | Flag keys added to player state when visiting this node |

#### Node Types

- **`start`** — The entry point. There must be exactly one, and `startNodeId` must reference it.
- **`video`** — A standard scene with choices leading to other nodes.
- **`ending`** — A terminal node. No choices. Triggers the end screen.

### Choices

```json
{
  "id": "hallway_left",
  "label": "Go left toward the storage room",
  "targetNodeId": "storage",
  "showAtTime": 4.5,
  "condition": "has_keycard"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique within the parent node |
| `label` | string | Yes | Button text shown to the user |
| `targetNodeId` | string | Yes | ID of the node this choice leads to |
| `showAtTime` | number | No | Seconds into the video when this choice appears (for `during_video` timing) |
| `condition` | string | No | Flag key that must exist in player state for this choice to be visible |

### Conditional Branching (Flags)

Flags enable conditional story logic:

1. A node sets flags via `setsFlags: ["has_keycard"]`.
2. A choice can require a flag via `condition: "has_keycard"`.
3. If the player hasn't visited a node that sets that flag, the choice is hidden.

This allows gating content behind prior exploration. For example, in the sample story, the "Use the keycard" choice at the exit only appears if the player visited the storage room first.

---

## Video File Naming Convention

Video files should follow this naming pattern:

```
{nodeId}.{extension}
```

Examples:
```
intro.mp4
chapter1_choice_a.webm
ending_good.mp4
```

### Supported Formats

The application uses the HTML5 `<video>` element, so any browser-supported format works:

| Format | Extension | Browser Support |
|--------|-----------|-----------------|
| WebM (VP9) | `.webm` | Chrome, Firefox, Edge |
| MP4 (H.264) | `.mp4` | All modern browsers |
| MP4 (H.265) | `.mp4` | Safari, some Chrome |
| Ogg Theora | `.ogv` | Firefox, Chrome |

**Recommendation:** Use `.webm` (VP9) for best compression-to-quality ratio with broad support, or `.mp4` (H.264) for maximum compatibility.

### Directory Layout

```
public/stories/{story-name}/
├── story.json
└── videos/
    ├── intro.webm
    ├── chapter1.webm
    └── ...
```

The `config.videoBasePath` in story.json must point to the videos directory:
```json
"videoBasePath": "/stories/my-story/videos"
```

---

## Creating a New Story

### Step-by-step

1. **Create the directory structure:**
   ```bash
   mkdir -p public/stories/my-story/videos
   ```

2. **Create `story.json`** in `public/stories/my-story/` following the schema above.
   - Define all nodes (at least one `start` and one `ending`).
   - Wire choices between nodes.

3. **Add video files** to `public/stories/my-story/videos/`.
   - One video per node, named to match the `videoFile` field.

4. **Validate your story:**
   ```bash
   npm run validate-story public/stories/my-story/story.json
   ```

5. **Update `App.tsx`** to point to your story:
   ```tsx
   <StoryViewer storyUrl="/stories/my-story/story.json" />
   ```

6. **Run the dev server** and test:
   ```bash
   npm run dev
   ```

### Tips

- Start with a simple 3-node story (start → one choice → ending) and expand.
- Use the validator often — it catches broken references, unreachable nodes, and missing fields.
- Use the JSON Schema (`story.schema.json`) in your editor for autocomplete. In VS Code, add to your story.json:
  ```json
  {
    "$schema": "../story.schema.json",
    ...
  }
  ```

---

## CLI Tools

### `npm run validate-story [path]`

Validates a story JSON file for structural correctness.

```bash
# Validate the sample story
npm run validate-sample

# Validate a custom story
npm run validate-story -- public/stories/my-story/story.json
```

Checks performed:
- Required fields present
- Start node exists and has type `"start"`
- All choice `targetNodeId` values reference existing nodes
- No duplicate node or choice IDs
- Reachability analysis (warns about unreachable nodes)
- Ending node validation

### `npm run generate-placeholders`

Generates placeholder video files for the sample story. Requires `ffmpeg`.

Each video is a 5-second colored screen (1280x720) with:
- Node type badge (START, VIDEO, ENDING)
- Node title (large text)
- Subtitle (smaller text)
- Node ID (footer)

If ffmpeg is not installed, creates minimal stub WebM files that prevent 404 errors but won't actually play.

---

## Component Reference

### `StoryViewer`

**File:** `src/components/StoryViewer.tsx`

The top-level orchestrator. Renders the correct sub-component based on engine phase.

```tsx
<StoryViewer storyUrl="/stories/sample/story.json" />
```

| Prop | Type | Description |
|------|------|-------------|
| `storyUrl` | string | Path to story JSON relative to public root |

### `VideoPlayer`

**File:** `src/components/VideoPlayer.tsx`

HTML5 video player with loading/error states, progress bar, play/pause, and mute controls. Controls appear on hover.

| Prop | Type | Description |
|------|------|-------------|
| `node` | `StoryNode` | Current story node |
| `videoUrl` | string | Full URL to video file |
| `onEnded` | `() => void` | Called when video finishes |
| `onTimeUpdate` | `(time, duration) => void` | Optional. Fires on playback progress |
| `preloadUrls` | `string[]` | URLs to preload |
| `volume` | number | Initial volume (0-1) |
| `autoPlay` | boolean | Auto-play on load. Default: `true` |

### `ChoiceOverlay`

**File:** `src/components/ChoiceOverlay.tsx`

Renders choice buttons with staggered animation. Shows a prompt and numbered buttons.

| Prop | Type | Description |
|------|------|-------------|
| `choices` | `Choice[]` | Available choices |
| `onChoose` | `(choiceId) => void` | Called when user selects a choice |
| `prompt` | string | Optional. Text above buttons. Default: "What do you do?" |

### `StartScreen`

**File:** `src/components/StartScreen.tsx`

Displays story metadata and a "Begin Story" button.

### `EndScreen`

**File:** `src/components/EndScreen.tsx`

Shows ending title, exploration stats (scenes watched, unique nodes, % explored), and a "Play Again" button.

---

## Engine API Reference

### `StoryEngine` (class)

**File:** `src/engine/StoryEngine.ts`

Framework-agnostic state machine. Can be used outside React.

```ts
const engine = new StoryEngine();
await engine.load("/stories/sample/story.json");
engine.start();
engine.choose("intro_door");
engine.videoEnded();
engine.goBack();
engine.restart();
```

| Method | Returns | Description |
|--------|---------|-------------|
| `load(source)` | `Promise<void>` | Load from URL string or `StoryDefinition` object |
| `start()` | `void` | Begin from start node |
| `choose(choiceId)` | `boolean` | Navigate via choice. Returns false if invalid |
| `videoEnded()` | `void` | Signal video finished. Transitions to choosing/ended |
| `goBack()` | `boolean` | Return to previous node in history |
| `restart()` | `void` | Reset and start from beginning |
| `getNode(id)` | `StoryNode \| undefined` | Lookup a node by ID |
| `getNextNodes()` | `StoryNode[]` | All possible next nodes from current |
| `getVideoUrl(node)` | `string` | Full video URL for a node |
| `getAvailableChoices()` | `Choice[]` | Choices filtered by conditions |
| `on(event, listener)` | `() => void` | Subscribe to events. Returns unsubscribe fn |

#### Events

| Event | Payload | When |
|-------|---------|------|
| `stateChange` | — | Any state change (React hook listens here) |
| `nodeEnter` | `{ node }` | Entering a new node |
| `nodeExit` | `{ node }` | Leaving a node |
| `choiceMade` | `{ choice, fromNode }` | User selected a choice |
| `storyEnd` | `{ endingNode }` | Reached an ending node |
| `error` | `{ message }` | An error occurred |

### `useStoryEngine` (hook)

**File:** `src/hooks/useStoryEngine.ts`

React hook wrapping `StoryEngine` for reactive state.

```ts
const {
  state,        // Current StoryState (reactive)
  meta,         // Story metadata
  config,       // Story config
  start,        // () => void
  choose,       // (choiceId: string) => boolean
  restart,      // () => void
  goBack,       // () => boolean
  videoEnded,   // () => void
  getVideoUrl,  // (node: StoryNode) => string
  availableChoices,  // Choice[]
  nextNodes,    // StoryNode[]
  engine,       // Direct StoryEngine reference
} = useStoryEngine({ storyUrl: "/stories/sample/story.json" });
```

---

## Extending the Application

### Priority areas for future development

These are the features and improvements recommended for engineers picking up this project:

#### 1. During-Video Choices (`choiceTiming: "during_video"`)

The schema supports `showAtTime` on choices and `choiceTiming: "during_video"` on nodes, but the UI does not yet render choices during playback. Implementation:

- In `VideoPlayer`, use the `onTimeUpdate` callback to track current time.
- In `StoryViewer`, compare `currentTime` against each choice's `showAtTime`.
- Render a `ChoiceOverlay` variant that appears *while* the video continues playing.
- Handle the case where the user doesn't choose before the video ends.

#### 2. Save/Resume Progress

Add persistence via `localStorage`:

- Serialize `StoryState.history` and `StoryState.flags` on each state change.
- On load, check for saved state and offer "Continue" on the start screen.
- Key by story ID + version to invalidate stale saves.

#### 3. Story Selector / Multi-Story Support

Currently `App.tsx` hardcodes a single story URL. To support multiple stories:

- Create a `StoryBrowser` component that lists available stories.
- Each story directory includes a `story.json` with metadata.
- Create an index file (`public/stories/index.json`) listing all stories.
- Route between the browser and viewer (React Router or simple state).

#### 4. Analytics / Heatmap

Track choice popularity across plays:

- Use engine events (`choiceMade`, `storyEnd`) to collect data.
- Persist to `localStorage` or send to an analytics endpoint.
- Build a visualization showing which paths are most/least explored.

#### 5. Accessibility

Current a11y status:
- Choice buttons are keyboard-navigable.
- `aria-label` attributes on controls.

Needed:
- Screen reader announcements for phase transitions.
- Subtitle/closed caption support (WebVTT tracks).
- Reduced motion mode (disable animations).
- High contrast mode.

#### 6. Mobile / Touch Optimization

- Tap to show/hide controls (instead of hover).
- Swipe gestures for back navigation.
- Fullscreen API integration.
- Orientation lock for landscape video.

#### 7. Video Transition Effects

- Crossfade between scenes (two stacked `<video>` elements).
- Configurable per-node transition type and duration.
- The `theme` field on nodes can drive visual treatment.

#### 8. Testing

No tests exist yet. Recommended coverage:

- **Unit tests** for `StoryEngine` (load, navigate, conditions, history, edge cases).
- **Unit tests** for `validateStory` utility.
- **Component tests** for `ChoiceOverlay` and `StartScreen` (render, interaction).
- **Integration test** for full story playback flow.
- Use Vitest + React Testing Library.

---

## Known Limitations

- **No SSR** — purely client-side. SEO requires pre-rendering.
- **No streaming** — all videos must be fully hosted static files.
- **`during_video` timing not implemented** — choices only appear after video ends.
- **`allowRevisit` not implemented** — reserved in schema for future use.
- **No audio-only support** — nodes require video files.
- **Autoplay may be blocked** — browsers require user interaction before autoplay with sound. The first play after "Begin Story" satisfies this.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [React 19](https://react.dev) | UI rendering |
| [TypeScript 5.9](https://www.typescriptlang.org) | Type safety |
| [Vite 7](https://vite.dev) | Dev server, bundler, HMR |
| HTML5 `<video>` | Video playback |
| CSS (vanilla) | Styling — no framework dependency |
| [ffmpeg](https://ffmpeg.org) | Placeholder video generation (dev tooling) |

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run validate-sample` | Validate the included sample story |
| `npm run validate-story` | Validate any story JSON file |
| `npm run generate-placeholders` | Generate placeholder videos for sample story |

---

## License

This project is **dual-licensed**. See [LICENSE](./LICENSE) for full terms.

| User | License | Summary |
|------|---------|---------|
| **Educational users** | Educational Use License (unrestricted) | Free for all educational purposes without restriction. Covers accredited institutions, research organizations, non-profit educational orgs, and individuals (students, teachers, researchers) acting in an educational capacity. |
| **Everyone else** | MIT License | Standard MIT — free to use, modify, and distribute (including commercially) with attribution. |

**Which applies to me?**
- If you're a student, teacher, researcher, school, university, library, museum, or non-profit educational organization: **Educational Use License**. Use it however you want for learning, teaching, or research.
- If you're a company, independent developer, or using it commercially: **MIT License**. Include the copyright notice and you're good.
