/**
 * StoryViewer — Main orchestrator component.
 *
 * This is the top-level component that wires the story engine to the UI.
 * It manages phase transitions and renders the appropriate sub-component
 * for each phase: StartScreen, VideoPlayer + ChoiceOverlay, or EndScreen.
 */

import { type FC, useMemo } from "react";
import { useStoryEngine } from "../hooks/useStoryEngine";
import { StartScreen } from "./StartScreen";
import { VideoPlayer } from "./VideoPlayer";
import { ChoiceOverlay } from "./ChoiceOverlay";
import { EndScreen } from "./EndScreen";
import "./StoryViewer.css";

export interface StoryViewerProps {
  /**
   * Path to the story JSON file, relative to the public root.
   * Example: "/stories/sample/story.json"
   */
  storyUrl: string;
}

export const StoryViewer: FC<StoryViewerProps> = ({ storyUrl }) => {
  const {
    state,
    meta,
    config,
    start,
    choose,
    restart,
    goBack,
    videoEnded,
    getVideoUrl,
    availableChoices,
    nextNodes,
    engine,
  } = useStoryEngine({ storyUrl });

  // Preload URLs for upcoming videos
  const preloadUrls = useMemo(() => {
    return nextNodes.map((node) => getVideoUrl(node));
  }, [nextNodes, getVideoUrl]);

  // Total nodes (for EndScreen stats)
  const totalNodes = engine.totalNodes;

  // ---------------------------------------------------------------------------
  // Render by phase
  // ---------------------------------------------------------------------------

  // Loading
  if (state.phase === "loading") {
    return (
      <div className="story-viewer story-viewer--loading">
        <div className="story-viewer__loader">
          <div className="story-viewer__spinner" />
          <p>Loading story...</p>
        </div>
      </div>
    );
  }

  // Error
  if (state.phase === "error") {
    return (
      <div className="story-viewer story-viewer--error">
        <div className="story-viewer__error-box">
          <h2>Something went wrong</h2>
          <p>{state.error || "Unknown error"}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }

  // Start screen
  if (state.phase === "start_screen" && meta) {
    return (
      <div className="story-viewer">
        <StartScreen meta={meta} onStart={start} />
      </div>
    );
  }

  // Playing or choosing (video is on screen in both phases)
  if (
    (state.phase === "playing" ||
      state.phase === "choosing" ||
      state.phase === "transitioning") &&
    state.currentNode
  ) {
    const videoUrl = getVideoUrl(state.currentNode);

    return (
      <div
        className={`story-viewer story-viewer--active ${
          state.phase === "transitioning" ? "story-viewer--transitioning" : ""
        }`}
        data-theme={state.currentNode.theme}
      >
        {/* Node title badge */}
        <div className="story-viewer__node-title">
          {state.currentNode.title}
        </div>

        {/* Back button (when history > 1) */}
        {state.history.length > 1 && (
          <button
            className="story-viewer__back-btn"
            onClick={goBack}
            aria-label="Go back"
          >
            &larr; Back
          </button>
        )}

        {/* Video player */}
        <VideoPlayer
          node={state.currentNode}
          videoUrl={videoUrl}
          onEnded={videoEnded}
          preloadUrls={preloadUrls}
          volume={config?.defaultVolume ?? 1}
        />

        {/* Choice overlay (only during "choosing" phase) */}
        {state.phase === "choosing" && availableChoices.length > 0 && (
          <ChoiceOverlay choices={availableChoices} onChoose={choose} />
        )}
      </div>
    );
  }

  // Ended
  if (state.phase === "ended" && state.currentNode) {
    return (
      <div className="story-viewer">
        <EndScreen
          endingNode={state.currentNode}
          history={state.history}
          totalNodes={totalNodes}
          onRestart={restart}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="story-viewer story-viewer--loading">
      <p>Initializing...</p>
    </div>
  );
};
