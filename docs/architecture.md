# System Architecture

Overview of the Interactive Story Engine architecture and design decisions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   StoryLibrary   │  │  StoryViewer    │  │ Theme System │ │
│  │  (Browse/Import) │  │ (Playback Engine)│  │  (UI Themes) │ │
│  └─────────────────┘  └────────┬────────┘  └──────────────┘ │
│                                 │                            │
│                    ┌────────────┴────────────┐               │
│                    │     useStoryEngine      │               │
│                    │    (React Hook)         │               │
│                    └────────────┬────────────┘               │
│                                 │                            │
│                         ┌───────┴───────┐                    │
│                         │  StoryEngine  │                    │
│                         │ (State Machine)│                   │
│                         └───────┬───────┘                    │
│                                 │                            │
│                         ┌───────┴───────┐                    │
│                         │   story.json   │                    │
│                         │   (Static)     │                    │
│                         └───────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Import API (Node.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  ZIP Upload  │──│  Streaming   │──│   Validation     │   │
│  │   Handler    │  │ Extraction   │  │   & Storage      │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Catalog    │  │   File       │                         │
│  │   Store      │  │   System     │                         │
│  │ (JSON Index) │  │   (data/)    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── ThemeProvider (Global theme state)
│   └── ErrorBoundary (Error handling)
│       └── ProgressProvider (Save/resume state)
│           └── StoryLibrary
│           │   ├── Header (Logo, theme toggle)
│           │   ├── ImportSection (ZIP upload)
│           │   └── StoryGrid (Story cards)
│           │
│           └── StoryViewer (When story selected)
│               ├── StartScreen
│               │   ├── Logo
│               │   ├── Metadata
│               │   └── Actions (Begin, Resume)
│               │
│               ├── VideoPlayer
│               │   ├── Video element
│               │   ├── Controls (Play, Volume, Fullscreen)
│               │   └── Progress bar
│               │
│               ├── ChoiceOverlay
│               │   └── ChoiceButtons
│               │
│               └── EndScreen
│                   ├── Stats
│                   └── Actions (Replay, Back)
```

## State Management

### StoryEngine State Machine

The core state machine has these phases:

```
                    ┌──────────────┐
                    │   loading    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
         ┌─────────│ start_screen │◄────────┐
         │         └──────┬───────┘         │
         │                │                  │
         │                ▼                  │
         │         ┌──────────────┐         │
         │    ┌───►│   playing    │         │
         │    │    └──────┬───────┘         │
         │    │           │                  │
         │    │           ▼                  │
         │    │    ┌──────────────┐          │
         │    └────│  choosing    │          │
         │         └──────┬───────┘          │
         │                │                  │
         │                ▼                  │
         │         ┌──────────────┐          │
         └─────────│ transitioning│──────────┘
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │    ended     │
                   └──────────────┘
```

**State Transitions:**

1. **loading** → **start_screen**: Story loaded successfully
2. **start_screen** → **playing**: User clicks "Begin"
3. **playing** → **choosing**: Video ends
4. **choosing** → **transitioning** → **playing**: User makes choice
5. **playing** → **ended**: Reach ending node
6. **ended** → **start_screen**: User restarts

### State Shape

```typescript
interface StoryState {
  phase: PlaybackPhase;
  currentNode: StoryNode | null;
  history: HistoryEntry[];
  flags: Set<string>;
  error?: string;
}

interface HistoryEntry {
  nodeId: string;
  timestamp: number;
  choiceId?: string;
}
```

## Data Flow

### Story Loading Flow

```
1. User selects story
   │
   ▼
2. StoryViewer receives storyUrl prop
   │
   ▼
3. useStoryEngine calls engine.load(storyUrl)
   │
   ▼
4. Engine fetches story.json via HTTP
   │
   ▼
5. Engine validates story structure
   │
   ▼
6. Engine indexes nodes into Map for O(1) lookup
   │
   ▼
7. Engine transitions to 'start_screen' phase
   │
   ▼
8. UI renders StartScreen component
```

### Choice Selection Flow

```
1. Video ends, engine enters 'choosing' phase
   │
   ▼
2. ChoiceOverlay renders available choices
   │
   ▼
3. User clicks choice button
   │
   ▼
4. onChoose callback calls engine.choose(choiceId)
   │
   ▼
5. Engine validates choice exists and conditions met
   │
   ▼
6. Engine records choice in history
   │
   ▼
7. Engine transitions to 'transitioning' phase
   │
   ▼
8. Engine loads target node
   │
   ▼
9. Engine transitions to 'playing' phase
   │
   ▼
10. VideoPlayer renders new video
```

### Progress Persistence Flow

```
1. User makes progress in story
   │
   ▼
2. StoryEngine emits stateChange event
   │
   ▼
3. ProgressProvider creates snapshot
   │
   ▼
4. Snapshot saved to localStorage
   │
   ▼
5. User returns later
   │
   ▼
6. ProgressProvider checks localStorage
   │
   ▼
7. If valid snapshot exists, offer "Continue"
   │
   ▼
8. User clicks "Continue"
   │
   ▼
9. Engine loads progress snapshot
   │
   ▼
10. Story resumes from saved point
```

## File Organization

```
src/
├── config/
│   └── branding.ts          # Brand configuration
├── contexts/
│   ├── ThemeContext.tsx     # Theme state management
│   └── ProgressContext.tsx  # Progress persistence
├── engine/
│   └── StoryEngine.ts       # Core state machine
├── hooks/
│   ├── useStoryEngine.ts    # Engine React hook
│   ├── useTheme.ts          # Theme hook
│   └── useStoryProgress.ts  # Progress hook
├── components/
│   ├── StoryLibrary.tsx     # Story browser
│   ├── StoryViewer.tsx      # Main orchestrator
│   ├── VideoPlayer.tsx      # Video playback
│   ├── ChoiceOverlay.tsx    # Choice buttons
│   ├── StartScreen.tsx      # Story start
│   ├── EndScreen.tsx        # Story end
│   ├── ThemeToggle.tsx      # Theme selector
│   ├── KeyboardShortcuts.tsx # Shortcuts modal
│   ├── LoadingSpinner.tsx   # Loading states
│   └── ErrorBoundary.tsx    # Error handling
├── types/
│   └── story.ts             # TypeScript definitions
├── utils/
│   ├── storyApi.ts          # API client
│   └── validateStory.ts     # Story validation
├── styles/
│   └── brand-variables.css  # Theme CSS variables
├── App.tsx                  # Root component
├── main.tsx                 # Entry point
└── index.css                # Global styles

server/                      # Import API
├── index.mjs                # API entry
├── zip-importer.mjs         # ZIP handling
├── catalog-store.mjs        # Story catalog
└── validate-story.mjs       # Server validation

public/
├── branding/                # Brand assets
│   ├── logo.svg
│   ├── favicon.ico
│   └── hero-bg.svg
└── stories/                 # Static stories
    └── sample/
        ├── story.json
        └── videos/

data/                        # Imported stories
└── stories/
    └── {uuid}/
        ├── story.json
        └── videos/
```

## Key Design Decisions

### 1. Separation of Engine and UI

**Decision:** Keep StoryEngine framework-agnostic

**Rationale:**
- Can be used with other frameworks (Vue, Svelte, vanilla JS)
- Easier to test without React
- Clear separation of concerns

### 2. Static Story Files

**Decision:** Store stories as static JSON files

**Rationale:**
- Simple to create and edit
- Version control friendly
- No database required
- Easy to distribute

### 3. Client-Side State Management

**Decision:** Use React Context + Hooks (not Redux)

**Rationale:**
- Simpler for this scale
- Built into React
- No additional dependencies
- Easier to understand

### 4. ZIP Import API

**Decision:** Separate Node.js API for imports

**Rationale:**
- Handles streaming for large files
- Server-side validation
- Security (path traversal protection)
- Catalog management

### 5. CSS Custom Properties for Theming

**Decision:** Use CSS variables for themes

**Rationale:**
- No JavaScript overhead
- Hardware-accelerated
- Runtime customization
- Better performance

### 6. localStorage for Persistence

**Decision:** Use localStorage (not IndexedDB)

**Rationale:**
- Simpler API
- Sufficient for this use case
- Widely supported
- No complex schema

## Performance Considerations

### Video Preloading

- Preload next possible videos via `<link rel="preload">`
- Configurable with `config.preloadNext`
- Reduces buffering between scenes

### Node Indexing

- Stories indexed into `Map<string, StoryNode>`
- O(1) node lookup
- Fast navigation even with large stories

### Lazy Loading

- Components loaded on demand
- Videos loaded when needed
- No unnecessary asset loading

### Memoization

- Callbacks memoized with `useCallback`
- Derived state memoized with `useMemo`
- Prevents unnecessary re-renders

## Security

### ZIP Import Security

- **Path Traversal Protection:** Validates all paths
- **Size Limits:** Max ZIP size, max entries
- **File Allowlist:** Only allowed file types
- **Streaming:** No buffering entire archive

### Content Security

- Videos served from same origin or CORS-enabled
- No inline scripts
- Strict Content-Type headers

### Data Protection

- Progress saved client-side only
- No user data transmitted
- localStorage isolated per origin

## Scalability

### Current Limits

- Stories: No hard limit (depends on storage)
- Nodes per story: Tested up to 1000
- Video files: Limited by browser storage
- Concurrent users: Stateless, scales horizontally

### Future Scalability

- **CDN:** Serve videos from CDN
- **Database:** Optional cloud save
- **Microservices:** Split API into services
- **Caching:** Redis for catalog caching

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Progressive Enhancement

- Works without JavaScript (basic HTML)
- Graceful degradation for older browsers
- Polyfills for modern APIs

## Development Workflow

### Hot Module Replacement

Vite provides HMR for fast development:
- React components
- CSS/SCSS
- Static assets

### Testing Strategy

- **Unit:** StoryEngine logic
- **Component:** React components
- **Integration:** Full playback flow
- **E2E:** ZIP import, story creation

### Build Process

1. TypeScript compilation
2. Vite bundling
3. Asset optimization
4. Output to `dist/`

## Next Steps

- [Quick Start Guide](quickstart.md)
- [Story Format](story-format.md)
- [API Reference](api-reference.md)
- [Component Reference](components.md)
