import { describe, expect, it } from "vitest";
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
});
