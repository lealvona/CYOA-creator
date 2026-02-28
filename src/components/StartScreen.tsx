/**
 * StartScreen — Title screen shown before the story begins.
 *
 * Displays story metadata (title, description, author) and a
 * "Begin" button to start playback.
 */

import type { FC } from "react";
import type { StoryMeta } from "../types/story";
import "./StartScreen.css";

export interface StartScreenProps {
  /** Story metadata to display. */
  meta: StoryMeta;

  /** Callback when user clicks "Begin". */
  onStart: () => void;
}

export const StartScreen: FC<StartScreenProps> = ({ meta, onStart }) => {
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

        <button className="start-screen__begin" onClick={onStart}>
          Begin Story
        </button>

        <p className="start-screen__hint">
          You will make choices that shape the story.
          <br />
          There are multiple paths and endings to discover.
        </p>
      </div>
    </div>
  );
};
