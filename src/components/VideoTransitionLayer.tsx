/**
 * VideoTransitionLayer — Provides smooth transitions between video scenes.
 *
 * Renders two stacked VideoPlayer instances and manages crossfade/fade
 * transitions when navigating between nodes.
 */

import { useState, useRef, useEffect, useCallback, useMemo, type FC } from "react";
import { VideoPlayer, type VideoPlayerProps } from "./VideoPlayer";
import type { Transition, StoryNode } from "../types/story";
import "./VideoTransitionLayer.css";

export interface VideoTransitionLayerProps {
  /** The current story node to play. */
  node: StoryNode;

  /** Full URL to the video file. */
  videoUrl: string;

  /** Transition configuration. */
  transition?: Transition;

  /** Callback when the video finishes playing. */
  onEnded: () => void;

  /** Callback with current playback time (fires on timeupdate). */
  onTimeUpdate?: (currentTime: number, duration: number) => void;

  /** URLs to preload (next possible videos). */
  preloadUrls?: string[];

  /** Initial volume (0-1). Default: 1 */
  volume?: number;

  /** Callback when playback pause/play state changes. */
  onPlaybackStateChange?: (isPlaying: boolean) => void;

  /** Callback when video fails to load/play. */
  onPlaybackError?: () => void;

  /** Callback when fullscreen state changes. */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

type TransitionPhase = "idle" | "loading" | "transitioning";

export const VideoTransitionLayer: FC<VideoTransitionLayerProps> = ({
  node,
  videoUrl,
  transition = { type: "cut", durationMs: 500 },
  onEnded,
  onTimeUpdate,
  preloadUrls = [],
  volume = 1,
  onPlaybackStateChange,
  onPlaybackError,
  onFullscreenChange,
}) => {
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const transitionTimeoutRef = useRef<number | undefined>(undefined);
  
  const durationMs = transition.durationMs ?? 500;
  const isTransitioning = phase === "transitioning";
  const isCut = transition.type === "cut";

  const transitionId = useRef(0);

  const frontVideo = useMemo(() => {
    if (isCut || phase === "idle") {
      return { url: videoUrl, node };
    }
    return null;
  }, [videoUrl, node, isCut, phase]);

  const backVideo = useMemo(() => {
    if (isCut || phase === "idle") {
      return null;
    }
    return { url: videoUrl, node };
  }, [videoUrl, node, isCut, phase]);

  useEffect(() => {
    if (!isCut && phase === "idle") {
      transitionId.current += 1;
      const id = transitionId.current;
      
      const timer = setTimeout(() => {
        if (transitionId.current === id && phase === "idle") {
          setPhase("loading");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [videoUrl, isCut, phase]);

  const handleBackCanPlay = useCallback(() => {
    if (phase === "loading") {
      setPhase("transitioning");

      transitionTimeoutRef.current = window.setTimeout(() => {
        setPhase("idle");
      }, durationMs);
    }
  }, [phase, durationMs]);

  const handleFrontEnded = useCallback(() => {
    if (!isTransitioning) {
      onEnded();
    }
  }, [isTransitioning, onEnded]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const getTransitionClass = () => {
    if (phase !== "transitioning") return "";
    return `transition-layer--${transition.type}`;
  };

  const commonPlayerProps: Omit<VideoPlayerProps, "node" | "videoUrl" | "onEnded"> = {
    onTimeUpdate,
    preloadUrls,
    volume,
    onPlaybackStateChange,
    onPlaybackError,
    onFullscreenChange,
  };

  return (
    <div 
      className="transition-layer"
      data-theme={frontVideo?.node.theme}
      data-transitioning={isTransitioning}
      style={{ "--transition-duration": `${durationMs}ms` } as React.CSSProperties}
    >
      <div className={`transition-layer__back ${getTransitionClass()}`}>
        {backVideo && (
          <VideoPlayer
            node={backVideo.node}
            videoUrl={backVideo.url}
            onEnded={() => {}}
            autoPlay={false}
            {...commonPlayerProps}
          />
        )}
        {backVideo && (
          <video
            key={backVideo.url}
            className="transition-layer__hidden"
            src={backVideo.url}
            onCanPlay={handleBackCanPlay}
            muted
          />
        )}
      </div>

      <div className={`transition-layer__front ${getTransitionClass()}`}>
        {frontVideo && (
          <VideoPlayer
            key={frontVideo.url}
            node={frontVideo.node}
            videoUrl={frontVideo.url}
            onEnded={handleFrontEnded}
            {...commonPlayerProps}
          />
        )}
      </div>
    </div>
  );
};
