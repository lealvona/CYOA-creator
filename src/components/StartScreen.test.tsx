import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartScreen } from "./StartScreen";
import type { StoryMeta } from "../types/story";

const mockMeta: StoryMeta = {
  title: "Test Story",
  description: "An amazing interactive adventure",
  author: "Test Author",
  version: "1.0.0",
  date: "2026-01-01",
  estimatedMinutes: 30,
  tags: ["adventure", "mystery"],
};

beforeEach(() => {
  cleanup();
});

describe("StartScreen", () => {
  it("renders story title", () => {
    render(<StartScreen meta={mockMeta} onStart={() => {}} />);

    expect(screen.getByText("Test Story")).toBeInTheDocument();
  });

  it("renders story description", () => {
    render(<StartScreen meta={mockMeta} onStart={() => {}} />);

    expect(screen.getByText("An amazing interactive adventure")).toBeInTheDocument();
  });

  it("renders author", () => {
    render(<StartScreen meta={mockMeta} onStart={() => {}} />);

    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
  });

  it("renders estimated duration when present", () => {
    render(<StartScreen meta={mockMeta} onStart={() => {}} />);

    expect(screen.getByText(/30 min/)).toBeInTheDocument();
  });

  it("renders tags when present", () => {
    render(<StartScreen meta={mockMeta} onStart={() => {}} />);

    expect(screen.getByText("adventure")).toBeInTheDocument();
    expect(screen.getByText("mystery")).toBeInTheDocument();
  });

  it("calls onStart when Begin Story button is clicked", async () => {
    const user = userEvent.setup();
    const handleStart = vi.fn();

    render(<StartScreen meta={mockMeta} onStart={handleStart} />);

    await user.click(screen.getByText("Begin Story"));

    expect(handleStart).toHaveBeenCalled();
  });

  it("renders Continue button when canResume is true", () => {
    render(
      <StartScreen
        meta={mockMeta}
        onStart={() => {}}
        canResume={true}
        onResume={() => {}}
      />
    );

    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("hides Continue button when canResume is false", () => {
    render(
      <StartScreen
        meta={mockMeta}
        onStart={() => {}}
        canResume={false}
        onResume={() => {}}
      />
    );

    expect(screen.queryByText("Continue")).not.toBeInTheDocument();
  });

  it("calls onResume when Continue button is clicked", async () => {
    const user = userEvent.setup();
    const handleResume = vi.fn();

    render(
      <StartScreen
        meta={mockMeta}
        onStart={() => {}}
        canResume={true}
        onResume={handleResume}
      />
    );

    await user.click(screen.getByText("Continue"));

    expect(handleResume).toHaveBeenCalled();
  });
});
