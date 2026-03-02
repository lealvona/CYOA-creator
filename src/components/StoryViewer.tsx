import { type FC, useEffect, useMemo, useState } from "react";
import type { Choice, StoryNode } from "../types/story";
import {
  type StoryProgressSnapshot,
} from "../engine/StoryEngine";
import { useStoryEngine } from "../hooks/useStoryEngine";
import { StartScreen } from "./StartScreen";
import { VideoPlayer } from "./VideoPlayer";
import { ChoiceOverlay } from "./ChoiceOverlay";
import { EndScreen } from "./EndScreen";
import "./StoryViewer.css";

const STORAGE_PREFIX = "cyoa-progress";

export interface StoryViewerProps {
  storyUrl: string;
  storyCompleteness?: "complete" | "incomplete";
  onExit?: () => void;
}

function getProgressStorageKey(storyUrl: string, storyKey?: string): string {
  const suffix = storyKey && storyKey.length > 0 ? storyKey : storyUrl;
  return `${STORAGE_PREFIX}:${suffix}`;
}

function filterTimedChoices(
  node: StoryNode,
  choices: Choice[],
  currentTime: number,
  duration: number,
  isPlaying: boolean,
  leadTime: number
): Choice[] {
  const timing = node.choiceTiming ?? "on_end";

  if (timing === "on_pause") {
    return isPlaying ? [] : choices;
  }

  if (timing === "during_video") {
    return choices.filter((choice) => {
      const at = choice.showAtTime ?? 0;
      return currentTime >= at;
    });
  }

  // on_end
  if (!Number.isFinite(duration) || duration <= 0) {
    return choices;
  }

  const remaining = duration - currentTime;
  if (remaining <= Math.max(0, leadTime)) {
    return choices;
  }

  return [];
}

export const StoryViewer: FC<StoryViewerProps> = ({
  storyUrl,
  storyCompleteness = "complete",
  onExit,
}) => {
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

  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const storyStorageKey = useMemo(
    () => getProgressStorageKey(storyUrl, engine.storyKey),
    [storyUrl, engine.storyKey]
  );

  const preloadUrls = useMemo(
    () =>
      (config?.preloadNext ?? true)
        ? nextNodes.map((node) => getVideoUrl(node))
        : [],
    [config?.preloadNext, nextNodes, getVideoUrl]
  );

  const visibleChoices = useMemo(() => {
    if (!state.currentNode) return [];
    if (state.phase === "choosing") return availableChoices;
    if (state.phase !== "playing") return [];

    return filterTimedChoices(
      state.currentNode,
      availableChoices,
      playbackTime,
      duration,
      isPlaying,
      config?.choiceLeadTime ?? 0
    );
  }, [
    state.currentNode,
    state.phase,
    availableChoices,
    playbackTime,
    duration,
    isPlaying,
    config?.choiceLeadTime,
  ]);

  const shouldShowChoiceOverlay =
    visibleChoices.length > 0 &&
    state.currentNode !== null &&
    (state.phase === "choosing" || state.phase === "playing");

  const savedSnapshot = useMemo<StoryProgressSnapshot | null>(() => {
    if (state.phase !== "start_screen") return null;
    const raw = localStorage.getItem(storyStorageKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as StoryProgressSnapshot;
      return parsed.currentNodeId ? parsed : null;
    } catch {
      localStorage.removeItem(storyStorageKey);
      return null;
    }
  }, [state.phase, storyStorageKey]);

  useEffect(() => {
    if (state.phase === "playing") {
      const snapshot = engine.createProgressSnapshot();
      if (snapshot) {
        localStorage.setItem(storyStorageKey, JSON.stringify(snapshot));
      }
    }

    if (state.phase === "ended") {
      localStorage.removeItem(storyStorageKey);
    }
  }, [engine, state.phase, storyStorageKey]);

  const handleResume = () => {
    if (!savedSnapshot) return;
    const loaded = engine.loadProgressSnapshot(savedSnapshot);
    if (!loaded) {
      localStorage.removeItem(storyStorageKey);
      start();
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(storyStorageKey);
    restart();
  };

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

  if (state.phase === "start_screen" && meta) {
    return (
      <div className="story-viewer">
        <StartScreen
          meta={meta}
          onStart={start}
          canResume={savedSnapshot !== null}
          onResume={handleResume}
        />
      </div>
    );
  }

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
        <div className="story-viewer__node-title">{state.currentNode.title}</div>

        {config?.allowRevisit && state.history.length > 1 && (
          <button
            className="story-viewer__back-btn"
            onClick={goBack}
            aria-label="Go back"
          >
            &larr; Back
          </button>
        )}

        {onExit && (
          <button
            className="story-viewer__exit-btn"
            onClick={onExit}
            aria-label="Back to library"
          >
            Library
          </button>
        )}

        {storyCompleteness === "incomplete" && (
          <div className="story-viewer__draft-badge" role="status">
            Draft package: missing clips may be skipped.
          </div>
        )}

        <VideoPlayer
          key={state.currentNode.id}
          node={state.currentNode}
          videoUrl={videoUrl}
          onEnded={videoEnded}
          preloadUrls={preloadUrls}
          volume={config?.defaultVolume ?? 1}
          onTimeUpdate={(current, total) => {
            setPlaybackTime(current);
            setDuration(total);
          }}
          onPlaybackStateChange={setIsPlaying}
        />

        {shouldShowChoiceOverlay && (
          <ChoiceOverlay choices={visibleChoices} onChoose={choose} />
        )}
      </div>
    );
  }

  if (state.phase === "ended" && state.currentNode) {
    return (
      <div className="story-viewer">
        <EndScreen
          endingNode={state.currentNode}
          history={state.history}
          totalNodes={engine.totalNodes}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div className="story-viewer story-viewer--loading">
      <p>Initializing...</p>
    </div>
  );
};
