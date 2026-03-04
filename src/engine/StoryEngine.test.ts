import { describe, expect, it, vi } from "vitest";
import { StoryEngine } from "./StoryEngine";
import type { StoryDefinition } from "../types/story";

function buildStory(overrides?: Partial<StoryDefinition>): StoryDefinition {
  return {
    meta: {
      title: "Test Story",
      description: "Story for tests",
      author: "tests",
      version: "1.0.0",
      date: "2026-03-02",
    },
    config: {
      videoBasePath: "/stories/test/videos",
      allowRevisit: true,
    },
    startNodeId: "start",
    nodes: [
      {
        id: "start",
        title: "Start",
        type: "start",
        videoFile: "start.mp4",
        setsFlags: ["visited_start"],
        choices: [
          { id: "to-a", label: "Go A", targetNodeId: "a" },
          { id: "to-b", label: "Go B", targetNodeId: "b", condition: "unlock_b" },
        ],
      },
      {
        id: "a",
        title: "A",
        type: "video",
        videoFile: "a.mp4",
        setsFlags: ["unlock_b"],
        choices: [{ id: "a-end", label: "End", targetNodeId: "end" }],
      },
      {
        id: "b",
        title: "B",
        type: "video",
        videoFile: "b.mp4",
        choices: [{ id: "b-end", label: "End", targetNodeId: "end" }],
      },
      {
        id: "end",
        title: "End",
        type: "ending",
        videoFile: "end.mp4",
        choices: [],
      },
    ],
    ...overrides,
  };
}

describe("StoryEngine", () => {
  it("loads story and starts at start node", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());

    expect(engine.phase).toBe("start_screen");

    engine.start();
    expect(engine.currentNode?.id).toBe("start");
    expect(engine.phase).toBe("playing");
  });

  it("filters conditional choices based on flags", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    const firstChoices = engine.getAvailableChoices();
    expect(firstChoices.map((c) => c.id)).toEqual(["to-a"]);

    engine.choose("to-a");
    engine.goBack();

    const unlockedChoices = engine.getAvailableChoices();
    expect(unlockedChoices.map((c) => c.id).sort()).toEqual(["to-a", "to-b"]);
  });

  it("supports goBack only when allowRevisit is true", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();
    engine.choose("to-a");

    expect(engine.currentNode?.id).toBe("a");
    expect(engine.goBack()).toBe(true);
    expect(engine.currentNode?.id).toBe("start");

    const lockedEngine = new StoryEngine();
    await lockedEngine.load(
      buildStory({ config: { videoBasePath: "/stories/test/videos", allowRevisit: false } })
    );
    lockedEngine.start();
    lockedEngine.choose("to-a");

    expect(lockedEngine.goBack()).toBe(false);
    expect(lockedEngine.currentNode?.id).toBe("a");
  });

  it("creates and restores progress snapshots", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();
    engine.choose("to-a");

    const snapshot = engine.createProgressSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot?.currentNodeId).toBe("a");

    const fresh = new StoryEngine();
    await fresh.load(buildStory());
    const loaded = fresh.loadProgressSnapshot(snapshot!);

    expect(loaded).toBe(true);
    expect(fresh.currentNode?.id).toBe("a");
    expect(fresh.phase).toBe("playing");
  });

  it("rejects invalid snapshot story key", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();
    const snapshot = engine.createProgressSnapshot();

    const otherStory = new StoryEngine();
    await otherStory.load(
      buildStory({ meta: { ...buildStory().meta, title: "Another story" } })
    );

    expect(otherStory.loadProgressSnapshot(snapshot!)).toBe(false);
  });

  it("loads story from URL and transitions to start_screen", async () => {
    const mockStory = buildStory();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockStory,
    } as Response);

    const engine = new StoryEngine();
    await engine.load("/stories/test/story.json");

    expect(engine.phase).toBe("start_screen");
    expect(engine.meta?.title).toBe("Test Story");

    vi.restoreAllMocks();
  });

  it("transitions to error phase on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    const engine = new StoryEngine();
    await engine.load("/stories/missing/story.json");

    expect(engine.phase).toBe("error");
    expect(engine.state.error).toContain("404");

    vi.restoreAllMocks();
  });

  it("transitions to error phase on invalid JSON", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: "structure" }),
    } as Response);

    const engine = new StoryEngine();
    await engine.load("/stories/bad/story.json");

    expect(engine.phase).toBe("error");

    vi.restoreAllMocks();
  });

  it("start() without load sets error phase", () => {
    const engine = new StoryEngine();
    engine.start();

    expect(engine.phase).toBe("error");
    expect(engine.state.error).toContain("no story loaded");
  });

  it("choose() returns false for invalid choice ID", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    const result = engine.choose("nonexistent-choice");

    expect(result).toBe(false);
    expect(engine.currentNode?.id).toBe("start");
  });

  it("choose() returns false for unmet condition and logs warning", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    const result = engine.choose("to-b");

    expect(result).toBe(false);
    expect(engine.currentNode?.id).toBe("start");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("videoEnded() on node with choices transitions to choosing", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    engine.videoEnded();

    expect(engine.phase).toBe("choosing");
  });

  it("videoEnded() when phase is not playing is no-op", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());

    engine.videoEnded();
    expect(engine.phase).toBe("start_screen");
  });

  it("videoEnded() on ending node transitions to ended", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();
    engine.choose("to-a");
    engine.videoEnded();

    expect(engine.phase).toBe("choosing");
  });

  it("videoEnded() on ending node emits storyEnd event", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();
    engine.choose("to-a");
    engine.videoEnded();
    engine.choose("a-end");

    let storyEndFired = false;
    const unsubscribe = engine.on("storyEnd", () => {
      storyEndFired = true;
    });

    engine.videoEnded();

    expect(engine.phase).toBe("ended");
    expect(storyEndFired).toBe(true);
    unsubscribe();
  });

  it("videoEnded() from start_screen phase is no-op", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());

    engine.videoEnded();
    expect(engine.phase).toBe("start_screen");
  });

  it("videoEnded() on node with choices transitions to choosing", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    engine.videoEnded();

    expect(engine.phase).toBe("choosing");
  });

  it("flags accumulate across multiple nodes", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    expect(engine.state.flags.has("visited_start")).toBe(true);

    engine.choose("to-a");
    expect(engine.state.flags.has("unlock_b")).toBe(true);
    expect(engine.state.flags.has("visited_start")).toBe(true);
  });

  it("goBack() returns false with empty history", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();

    expect(engine.goBack()).toBe(false);
    expect(engine.currentNode?.id).toBe("start");
  });

  it("restart() resets flags and restarts from beginning", async () => {
    const engine = new StoryEngine();
    await engine.load(buildStory());
    engine.start();
    engine.choose("to-a");

    expect(engine.state.flags.has("visited_start")).toBe(true);
    expect(engine.state.flags.has("unlock_b")).toBe(true);

    engine.restart();

    expect(engine.state.flags.size).toBe(1);
    expect(engine.state.flags.has("visited_start")).toBe(true);
    expect(engine.currentNode?.id).toBe("start");
  });

  it("emits nodeEnter and stateChange on start", async () => {
    const events: string[] = [];
    const engine = new StoryEngine();
    await engine.load(buildStory());

    engine.on("nodeEnter", () => events.push("nodeEnter"));
    engine.on("stateChange", () => events.push("stateChange"));

    engine.start();

    expect(events).toContain("nodeEnter");
    expect(events).toContain("stateChange");
  });
});
