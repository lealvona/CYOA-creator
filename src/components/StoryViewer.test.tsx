import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StoryNode } from "../types/story";
import { StoryViewer } from "./StoryViewer";

const hookMocks = vi.hoisted(() => ({
  useStoryEngine: vi.fn(),
}));

vi.mock("../hooks/useStoryEngine", () => ({
  useStoryEngine: hookMocks.useStoryEngine,
}));

vi.mock("./VideoPlayer", () => ({
  VideoPlayer: ({ onEnded }: { onEnded: () => void }) => (
    <button onClick={onEnded}>Mock Video End</button>
  ),
}));

const baseNode: StoryNode = {
  id: "intro",
  title: "Intro",
  type: "start",
  videoFile: "intro.mp4",
  choices: [],
};

function createEngineState(overrides: Record<string, unknown> = {}) {
  return {
    state: {
      phase: "start_screen",
      currentNode: null,
      history: [],
      flags: new Set<string>(),
      ...((overrides.state as object | undefined) ?? {}),
    },
    meta: {
      title: "Test",
      description: "desc",
      author: "author",
      version: "1.0.0",
      date: "2026-03-02",
    },
    config: { allowRevisit: true, preloadNext: true, defaultVolume: 1, choiceLeadTime: 0 },
    start: vi.fn(),
    choose: vi.fn(),
    restart: vi.fn(),
    goBack: vi.fn(),
    videoEnded: vi.fn(),
    getVideoUrl: vi.fn(() => "/videos/intro.mp4"),
    availableChoices: [],
    nextNodes: [],
    engine: {
      totalNodes: 3,
      storyKey: "test::1.0.0",
      createProgressSnapshot: vi.fn(() => null),
      loadProgressSnapshot: vi.fn(() => true),
    },
    ...overrides,
  };
}

describe("StoryViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows continue button when saved snapshot exists", () => {
    localStorage.setItem(
      "cyoa-progress:test::1.0.0",
      JSON.stringify({
        storyKey: "test::1.0.0",
        currentNodeId: "intro",
        history: [],
        flags: [],
        phase: "playing",
        timestamp: Date.now(),
      })
    );

    hookMocks.useStoryEngine.mockReturnValue(createEngineState());

    render(<StoryViewer storyUrl="/stories/sample/story.json" />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("renders draft badge for incomplete story package during playback", () => {
    hookMocks.useStoryEngine.mockReturnValue(
      createEngineState({
        state: {
          phase: "playing",
          currentNode: baseNode,
          history: [{ nodeId: "intro", timestamp: Date.now() }],
          flags: new Set<string>(),
        },
      })
    );

    render(
      <StoryViewer storyUrl="/stories-imported/x/story.json" storyCompleteness="incomplete" />
    );

    expect(screen.getByText(/Draft package: missing clips may be skipped/)).toBeInTheDocument();
  });

  it("calls onExit when library button clicked", () => {
    const onExit = vi.fn();
    hookMocks.useStoryEngine.mockReturnValue(
      createEngineState({
        state: {
          phase: "playing",
          currentNode: baseNode,
          history: [{ nodeId: "intro", timestamp: Date.now() }],
          flags: new Set<string>(),
        },
      })
    );

    render(<StoryViewer storyUrl="/stories/sample/story.json" onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to library" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
