/**
 * VideoPlayer — Renders an HTML5 <video> element for a story node.
 *
 * Responsibilities:
 *  - Play the video for the current node
 *  - Emit onEnded when playback finishes
 *  - Support preloading of upcoming videos via hidden <link rel="preload">
 *  - Handle loading/error states gracefully
 *  - Provide basic playback controls (play/pause, mute, volume)
 */

import { useRef, useEffect, useState, useCallback, type FC } from "react";
import type { StoryNode } from "../types/story";
import "./VideoPlayer.css";

export interface VideoPlayerProps {
  /** The current story node to play. */
  node: StoryNode;

  /** Full URL to the video file. */
  videoUrl: string;

  /** Callback when the video finishes playing. */
  onEnded: () => void;

  /** Callback with current playback time (fires on timeupdate). */
  onTimeUpdate?: (currentTime: number, duration: number) => void;

  /** URLs to preload (next possible videos). */
  preloadUrls?: string[];

  /** Initial volume (0-1). Default: 1 */
  volume?: number;

  /** Whether to auto-play. Default: true */
  autoPlay?: boolean;

  /** Callback when playback pause/play state changes. */
  onPlaybackStateChange?: (isPlaying: boolean) => void;

  /** Callback when video fails to load/play. */
  onPlaybackError?: () => void;

  /** Callback when fullscreen state changes. */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  node,
  videoUrl,
  onEnded,
  onTimeUpdate,
  preloadUrls = [],
  volume = 1,
  autoPlay = true,
  onPlaybackStateChange,
  onPlaybackError,
  onFullscreenChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Set volume
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
    }
  }, [volume]);

  // Handle video events
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch((err) => {
        // Autoplay blocked — user must interact
        console.warn("[VideoPlayer] Autoplay blocked:", err);
        setIsPlaying(false);
      });
    }
  }, [autoPlay]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlaybackStateChange?.(true);
  }, [onPlaybackStateChange]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlaybackStateChange?.(false);
  }, [onPlaybackStateChange]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const pct = video.duration ? video.currentTime / video.duration : 0;
    setProgress(pct);
    onTimeUpdate?.(video.currentTime, video.duration);
  }, [onTimeUpdate]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    console.error(`[VideoPlayer] Error loading video: ${videoUrl}`);
    onPlaybackError?.();
  }, [videoUrl, onPlaybackError]);

  // Playback toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreen = !!document.fullscreenElement;
      setIsFullscreen(fullscreen);
      onFullscreenChange?.(fullscreen);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onFullscreenChange]);

  // Auto-hide controls after 3 seconds of inactivity
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Tap to toggle controls visibility
  const handlePlayerClick = useCallback(() => {
    if (!isFullscreen) return;
    setControlsVisible((prev) => !prev);
    showControls();
  }, [isFullscreen, showControls]);

  return (
    <div
      ref={containerRef}
      className={`video-player ${controlsVisible ? "video-player--controls-visible" : ""}`}
      data-node-id={node.id}
      onClick={handlePlayerClick}
    >
      {/* Preload links for upcoming videos */}
      {preloadUrls.map((url) => (
        <link key={url} rel="preload" as="video" href={url} />
      ))}

      {/* Loading overlay */}
      {isLoading && (
        <div className="video-player__loading">
          <div className="video-player__spinner" />
          <span>Loading...</span>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="video-player__error">
          <span>Failed to load video</span>
          <p className="video-player__error-path">{videoUrl}</p>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              videoRef.current?.load();
            }}
          >
            Retry
          </button>
          <button onClick={onEnded}>Skip Scene</button>
        </div>
      )}

      {/* The video element */}
      <video
        ref={videoRef}
        className="video-player__video"
        src={videoUrl}
        onCanPlay={handleCanPlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        playsInline
        preload="auto"
      />

      {/* Subtitle / description */}
      {node.subtitle && (
        <div className="video-player__subtitle">{node.subtitle}</div>
      )}

      {/* Minimal controls bar */}
      <div className="video-player__controls">
        <button
          className="video-player__btn"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "||" : "\u25B6"}
        </button>

        {/* Progress bar */}
        <div className="video-player__progress-track">
          <div
            className="video-player__progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <button
          className="video-player__btn"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
        </button>

        <button
          className="video-player__btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? "\u2716" : "\u26F6"}
        </button>
      </div>
    </div>
  );
};
