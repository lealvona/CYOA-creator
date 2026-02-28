/**
 * ChoiceOverlay — Renders interactive choice buttons over the video.
 *
 * Displayed when the engine phase transitions to "choosing".
 * Animates in with a staggered fade. Each button triggers engine.choose().
 */

import { type FC, useState } from "react";
import type { Choice } from "../types/story";
import "./ChoiceOverlay.css";

export interface ChoiceOverlayProps {
  /** Available choices to display. */
  choices: Choice[];

  /** Callback when the user selects a choice. */
  onChoose: (choiceId: string) => void;

  /** Optional prompt text above the choices. */
  prompt?: string;
}

export const ChoiceOverlay: FC<ChoiceOverlayProps> = ({
  choices,
  onChoose,
  prompt = "What do you do?",
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    <div className="choice-overlay" role="dialog" aria-label="Make a choice">
      <div className="choice-overlay__backdrop" />

      <div className="choice-overlay__content">
        <p className="choice-overlay__prompt">{prompt}</p>

        <div className="choice-overlay__buttons">
          {choices.map((choice, index) => (
            <button
              key={choice.id}
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
