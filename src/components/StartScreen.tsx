/**
 * StartScreen — Title screen shown before the story begins.
 *
 * Displays story metadata (title, description, author) and a
 * "Begin" button to start playback.
 */

import { type FC, useRef, useEffect } from "react";
import type { StoryMeta } from "../types/story";
import "./StartScreen.css";

export interface StartScreenProps {
  /** Story metadata to display. */
  meta: StoryMeta;

  /** Callback when user clicks "Begin". */
  onStart: () => void;

  /** Optional callback to resume previously saved progress. */
  onResume?: () => void;

  /** Whether resume is available. */
  canResume?: boolean;
}

export const StartScreen: FC<StartScreenProps> = ({
  meta,
  onStart,
  onResume,
  canResume = false,
}) => {
  const beginButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    beginButtonRef.current?.focus();
  }, []);

  return (
    <div className="start-screen">
      <div className="start-screen__content">
        <h1 className="start-screen__title">{meta.title}</h1>

        {meta.description && (
          <p className="start-screen__description">{meta.description}</p>
        )}

        <div className="start-screen__meta">
          {meta.author && (
            <span className="start-screen__author">by {meta.author}</span>
          )}
          {meta.estimatedMinutes && (
            <span className="start-screen__duration">
              ~{meta.estimatedMinutes} min
            </span>
          )}
        </div>

        {meta.tags && meta.tags.length > 0 && (
          <div className="start-screen__tags">
            {meta.tags.map((tag) => (
              <span key={tag} className="start-screen__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="start-screen__actions">
          <button
            ref={beginButtonRef}
            className="start-screen__begin"
            onClick={onStart}
          >
            Begin Story
          </button>
          {canResume && onResume && (
            <button className="start-screen__resume" onClick={onResume}>
              Continue
            </button>
          )}
        </div>

        <p className="start-screen__hint">
          You will make choices that shape the story.
          <br />
          There are multiple paths and endings to discover.
        </p>
      </div>
    </div>
  );
};
