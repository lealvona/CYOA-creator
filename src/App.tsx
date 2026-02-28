import { StoryViewer } from "./components/StoryViewer";

/**
 * App — Root component.
 *
 * Renders the StoryViewer with the path to a story JSON file.
 * To switch stories, change the `storyUrl` prop.
 *
 * The story JSON and video assets live in `public/stories/<story-name>/`.
 */
function App() {
  return <StoryViewer storyUrl="/stories/sample/story.json" />;
}

export default App;
