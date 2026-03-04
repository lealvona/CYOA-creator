import { describe, expect, it } from "vitest";
import { assertStoryValid, validateStory } from "./validateStory";
import type { StoryDefinition } from "../types/story";

function validStory(): StoryDefinition {
  return {
    meta: {
      title: "Valid Story",
      description: "A valid test story",
      author: "Tester",
      version: "1.0.0",
      date: "2026-01-01",
    },
    config: {
      videoBasePath: "/videos",
    },
    startNodeId: "start",
    nodes: [
      {
        id: "start",
        title: "Start",
        type: "start",
        videoFile: "start.mp4",
        choices: [{ id: "c1", label: "Go to A", targetNodeId: "a" }],
      },
      {
        id: "a",
        title: "Node A",
        type: "video",
        videoFile: "a.mp4",
        choices: [{ id: "c2", label: "End", targetNodeId: "end" }],
      },
      {
        id: "end",
        title: "Ending",
        type: "ending",
        videoFile: "end.mp4",
        choices: [],
      },
    ],
  };
}

describe("validateStory", () => {
  it("passes for valid story", () => {
    expect(() => assertStoryValid(validStory())).not.toThrow();
  });

  it("throws on missing meta.title", () => {
    const story = validStory();
    story.meta.title = undefined as unknown as string;
    expect(() => assertStoryValid(story)).toThrow("title");
  });

  it("throws on missing config.videoBasePath", () => {
    const story = validStory();
    story.config.videoBasePath = undefined as unknown as string;
    expect(() => assertStoryValid(story)).toThrow("videoBasePath");
  });

  it("throws on missing startNodeId", () => {
    const story = validStory();
    story.startNodeId = "";
    expect(() => assertStoryValid(story)).toThrow("startNodeId");
  });

  it("throws on empty nodes array", () => {
    const story = validStory();
    story.nodes = [];
    expect(() => assertStoryValid(story)).toThrow("nodes");
  });

  it("throws on duplicate node IDs", () => {
    const story = validStory();
    story.nodes.push({ ...story.nodes[0], id: "start" });
    expect(() => assertStoryValid(story)).toThrow("Duplicate node ID");
  });

  it("throws when start node not found", () => {
    const story = validStory();
    story.startNodeId = "nonexistent";
    expect(() => assertStoryValid(story)).toThrow("does not exist");
  });

  it("throws when choice targetNodeId does not exist", () => {
    const story = validStory();
    story.nodes[0].choices[0].targetNodeId = "nonexistent";
    expect(() => assertStoryValid(story)).toThrow("non-existent");
  });

  it("warns on ending node with choices via validateStory", () => {
    const story = validStory();
    story.nodes[2].choices.push({ id: "c3", label: "Loop", targetNodeId: "start" });
    const issues = validateStory(story);
    const warnings = issues.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.message.includes("choice"))).toBe(true);
  });

  it("warns on video node without choices via validateStory", () => {
    const story = validStory();
    story.nodes[1].choices = [];
    const issues = validateStory(story);
    const warnings = issues.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.message.includes("no choices"))).toBe(true);
  });

  it("warns on orphaned nodes via validateStory", () => {
    const story = validStory();
    story.nodes.push({
      id: "orphan",
      title: "Orphan",
      type: "video",
      videoFile: "orphan.mp4",
      choices: [],
    });
    const issues = validateStory(story);
    const warnings = issues.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.message.includes("unreachable"))).toBe(true);
  });

  it("warns when no ending node via validateStory", () => {
    const story = validStory();
    story.nodes = story.nodes.filter((n) => n.id !== "end");
    const issues = validateStory(story);
    const warnings = issues.filter((i) => i.severity === "warning");
    expect(warnings.some((w) => w.message.includes("ending"))).toBe(true);
  });

  it("has no errors for valid story via validateStory", () => {
    const issues = validateStory(validStory());
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors.length).toBe(0);
  });
});
