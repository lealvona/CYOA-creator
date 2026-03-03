import { useState, useCallback } from "react";
import { StoryViewer } from "./components/StoryViewer";
import { StoryLibrary } from "./components/StoryLibrary";
import { KeyboardShortcuts } from "./components/KeyboardShortcuts";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { StoryCatalogItem } from "./types/library";

/**
 * App — Root component.
 *
 * Renders the StoryViewer with the path to a story JSON file.
 * To switch stories, change the `storyUrl` prop.
 *
 * The story JSON and video assets live in `public/stories/<story-name>/`.
 */
function App() {
  const [activeStory, setActiveStory] = useState<StoryCatalogItem | null>(null);

  const handleShortcut = useCallback((key: string) => {
    // Handle global keyboard shortcuts
    switch (key) {
      case 'escape':
        if (activeStory) {
          setActiveStory(null);
        }
        break;
      case '?':
        // Could show keyboard shortcuts modal
        console.log('Keyboard shortcuts help');
        break;
      default:
        break;
    }
  }, [activeStory]);

  return (
    <ErrorBoundary>
      <KeyboardShortcuts onShortcut={handleShortcut} />
      
      {!activeStory ? (
        <StoryLibrary onOpenStory={setActiveStory} />
      ) : (
        <StoryViewer
          storyUrl={activeStory.storyUrl}
          storyCompleteness={activeStory.completeness}
          onExit={() => setActiveStory(null)}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;
