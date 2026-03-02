import { useState } from "react";
import { StoryViewer } from "./components/StoryViewer";
import { StoryLibrary } from "./components/StoryLibrary";
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

  if (!activeStory) {
    return <StoryLibrary onOpenStory={setActiveStory} />;
  }

  return (
    <StoryViewer
      storyUrl={activeStory.storyUrl}
      storyCompleteness={activeStory.completeness}
      onExit={() => setActiveStory(null)}
    />
  );
}

export default App;
