import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoiceOverlay } from "./ChoiceOverlay";
import type { Choice } from "../types/story";

const mockChoices: Choice[] = [
  { id: "choice-1", label: "First Choice", targetNodeId: "node-a" },
  { id: "choice-2", label: "Second Choice", targetNodeId: "node-b" },
  { id: "choice-3", label: "Third Choice", targetNodeId: "node-c" },
];

beforeEach(() => {
  cleanup();
});

describe("ChoiceOverlay", () => {
  it("renders all choice buttons with labels", () => {
    render(<ChoiceOverlay choices={mockChoices} onChoose={() => {}} />);

    expect(screen.getByText("First Choice")).toBeInTheDocument();
    expect(screen.getByText("Second Choice")).toBeInTheDocument();
    expect(screen.getByText("Third Choice")).toBeInTheDocument();
  });

  it("renders numbered badges", () => {
    render(<ChoiceOverlay choices={mockChoices} onChoose={() => {}} />);

    const badges = screen.getAllByText("1");
    expect(badges.length).toBe(1);
    expect(badges[0]).toBeInTheDocument();
  });

  it("renders default prompt text", () => {
    render(<ChoiceOverlay choices={mockChoices} onChoose={() => {}} />);

    const prompts = screen.getAllByText("What do you do?");
    expect(prompts.length).toBe(1);
  });

  it("renders custom prompt", () => {
    render(
      <ChoiceOverlay
        choices={mockChoices}
        onChoose={() => {}}
        prompt="Choose your path"
      />
    );

    expect(screen.getByText("Choose your path")).toBeInTheDocument();
  });

  it("calls onChoose with correct choice ID after click", async () => {
    const user = userEvent.setup();
    const handleChoose = vi.fn();

    render(<ChoiceOverlay choices={mockChoices} onChoose={handleChoose} />);

    await user.click(screen.getByText("First Choice"));

    await waitFor(() => {
      expect(handleChoose).toHaveBeenCalledWith("choice-1");
    });
  });

  it("calls onChoose with second choice ID", async () => {
    const user = userEvent.setup();
    const handleChoose = vi.fn();

    render(<ChoiceOverlay choices={mockChoices} onChoose={handleChoose} />);

    await user.click(screen.getByText("Second Choice"));

    await waitFor(() => {
      expect(handleChoose).toHaveBeenCalledWith("choice-2");
    });
  });

  it("prevents double-click by disabling buttons after selection", async () => {
    const user = userEvent.setup();
    const handleChoose = vi.fn();

    render(<ChoiceOverlay choices={mockChoices} onChoose={handleChoose} />);

    const firstButton = screen.getByText("First Choice");
    await user.click(firstButton);
    await user.click(firstButton);

    await waitFor(() => {
      expect(handleChoose).toHaveBeenCalledTimes(1);
    });
  });

  it("has selected class on selected button", async () => {
    const user = userEvent.setup();
    const handleChoose = vi.fn();

    render(<ChoiceOverlay choices={mockChoices} onChoose={handleChoose} />);

    const firstButton = screen.getByText("First Choice").closest("button");

    await user.click(firstButton!);

    expect(firstButton).toHaveClass("choice-overlay__btn--selected");
  });

  it("has dimmed class on non-selected buttons when one is selected", async () => {
    const user = userEvent.setup();
    const handleChoose = vi.fn();

    render(<ChoiceOverlay choices={mockChoices} onChoose={handleChoose} />);

    await user.click(screen.getByText("First Choice"));

    const secondButton = screen.getByText("Second Choice").closest("button");
    expect(secondButton).toHaveClass("choice-overlay__btn--dimmed");
  });
});
