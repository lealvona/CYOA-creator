/**
 * useStoryEngine — React hook that wraps StoryEngine for reactive state.
 *
 * Provides:
 *  - Reactive access to engine state (re-renders on every state change)
 *  - Memoized action callbacks (start, choose, restart, goBack, videoEnded)
 *  - Auto-load story from URL on mount
 *  - Preloading of next videos
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { StoryEngine } from "../engine/StoryEngine";
import type {
  StoryState,
  StoryNode,
  StoryMeta,
  StoryConfig,
  Choice,
} from "../types/story";

export interface UseStoryEngineOptions {
  /** URL to the story JSON file (relative to public root). */
  storyUrl: string;

  /** Auto-start the story after loading (skip start screen). Default: false */
  autoStart?: boolean;
}

export interface UseStoryEngineReturn {
  /** Current engine state (reactive). */
  state: StoryState;

  /** Story metadata. */
  meta: Readonly<StoryMeta> | null;

  /** Story config. */
  config: Readonly<StoryConfig> | null;

  /** Start the story. */
  start: () => void;

  /** Make a choice by ID. Returns false if invalid. */
  choose: (choiceId: string) => boolean;

  /** Restart from beginning. */
  restart: () => void;

  /** Go back one step. Returns false if can't go back. */
  goBack: () => boolean;

  /** Signal video playback ended. */
  videoEnded: () => void;

  /** Get the full video URL for a node. */
  getVideoUrl: (node: StoryNode) => string;

  /** Get available choices for the current node. */
  availableChoices: Choice[];

  /** Get the next possible nodes (for preloading). */
  nextNodes: StoryNode[];

  /** Direct reference to the engine instance. */
  engine: StoryEngine;
}

export function useStoryEngine(
  options: UseStoryEngineOptions
): UseStoryEngineReturn {
  const { storyUrl, autoStart = false } = options;

  // Single engine instance per hook lifecycle
  const engineRef = useRef<StoryEngine>(new StoryEngine());
  const engine = engineRef.current;

  // Reactive state — updated on every engine stateChange event
  const [state, setState] = useState<StoryState>({ ...engine.state });

  // Subscribe to engine state changes
  useEffect(() => {
    const unsubscribe = engine.on("stateChange", () => {
      setState({ ...engine.state });
    });
    return unsubscribe;
  }, [engine]);

  // Load story on mount (or when storyUrl changes)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await engine.load(storyUrl);

      if (cancelled) return;

      if (autoStart) {
        engine.start();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engine, storyUrl, autoStart]);

  // Memoized callbacks
  const start = useCallback(() => engine.start(), [engine]);
  const choose = useCallback((id: string) => engine.choose(id), [engine]);
  const restart = useCallback(() => engine.restart(), [engine]);
  const goBack = useCallback(() => engine.goBack(), [engine]);
  const videoEnded = useCallback(() => engine.videoEnded(), [engine]);
  const getVideoUrl = useCallback(
    (node: StoryNode) => engine.getVideoUrl(node),
    [engine]
  );

  // Derived state
  const availableChoices = useMemo(
    () => engine.getAvailableChoices(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  const nextNodes = useMemo(
    () => engine.getNextNodes(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return {
    state,
    meta: engine.meta,
    config: engine.config,
    start,
    choose,
    restart,
    goBack,
    videoEnded,
    getVideoUrl,
    availableChoices,
    nextNodes,
    engine,
  };
}
