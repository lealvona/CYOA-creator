/**
 * ChoiceOverlay — Renders interactive choice buttons over the video.
 *
 * Displayed when the engine phase transitions to "choosing".
 * Animates in with a staggered fade. Each button triggers engine.choose().
 */

import { type FC, useState, useRef, useEffect } from "react";
import type { Choice } from "../types/story";
import "./ChoiceOverlay.css";

export interface ChoiceOverlayProps {
  /** Available choices to display. */
  choices: Choice[];

  /** Callback when the user selects a choice. */
  onChoose: (choiceId: string) => void;

  /** Optional prompt text above the choices. */
  prompt?: string;

  /** Display variant - modal (full screen) or inline (for during-video). Default: modal */
  variant?: "modal" | "inline";
}

export const ChoiceOverlay: FC<ChoiceOverlayProps> = ({
  choices,
  onChoose,
  prompt = "What do you do?",
  variant = "modal",
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  const handleClick = (choiceId: string) => {
    if (selectedId) return; // Prevent double-click
    setSelectedId(choiceId);

    // Brief delay for visual feedback before transitioning
    setTimeout(() => {
      onChoose(choiceId);
      setSelectedId(null);
    }, 400);
  };

  return (
    <div
      className={`choice-overlay choice-overlay--${variant}`}
      role="dialog"
      aria-label="Make a choice"
    >
      {variant === "modal" && <div className="choice-overlay__backdrop" />}

      <div className="choice-overlay__content">
        {variant === "modal" && (
          <p className="choice-overlay__prompt">{prompt}</p>
        )}

        <div className="choice-overlay__buttons">
          {choices.map((choice, index) => (
            <button
              key={choice.id}
              ref={index === 0 ? firstButtonRef : undefined}
              className={`choice-overlay__btn ${
                selectedId === choice.id ? "choice-overlay__btn--selected" : ""
              } ${selectedId && selectedId !== choice.id ? "choice-overlay__btn--dimmed" : ""}`}
              onClick={() => handleClick(choice.id)}
              disabled={!!selectedId}
              style={{
                animationDelay: `${index * 0.12}s`,
              }}
            >
              <span className="choice-overlay__btn-index">{index + 1}</span>
              <span className="choice-overlay__btn-label">{choice.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
