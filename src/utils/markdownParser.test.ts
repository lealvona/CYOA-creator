import { describe, it, expect } from "vitest";
import { parseMarkdownStory, storyToMarkdown, validateMarkdownStory } from "./markdownParser";

describe("markdownParser", () => {
  describe("parseMarkdownStory", () => {
    it("parses a basic story with metadata", () => {
      const markdown = `
# Title: Test Story
# Author: Test Author
# Description: A test story

## node:intro:start
Welcome to the story!
-> choice1 | First Choice | scene1
`;

      const story = parseMarkdownStory(markdown);
      
      expect(story.meta.title).toBe("Test Story");
      expect(story.meta.author).toBe("Test Author");
      expect(story.meta.description).toBe("A test story");
      expect(story.startNodeId).toBe("intro");
    });

    it("parses multiple nodes with choices", () => {
      const markdown = `
# Title: Adventure
# Author: Writer

## node:start:start
You are at a crossroads.
-> left | Go left | left_path
-> right | Go right | right_path

## node:left_path:video
You took the left path.
-> back | Go back | start

## node:right_path:ending
You found the treasure!
`;

      const story = parseMarkdownStory(markdown);
      
      expect(story.nodes).toHaveLength(3);
      expect(story.nodes[0].id).toBe("start");
      expect(story.nodes[0].choices).toHaveLength(2);
      expect(story.nodes[2].type).toBe("ending");
    });

    it("handles nodes without choices (endings)", () => {
      const markdown = `
# Title: Simple Story
# Author: Author

## node:intro:start
The end.

## node:end:ending
Goodbye.
`;

      const story = parseMarkdownStory(markdown);
      
      expect(story.nodes[1].choices).toHaveLength(0);
      expect(story.nodes[1].type).toBe("ending");
    });

    it("uses defaults for missing metadata", () => {
      const markdown = `
## node:test:start
Test content.
`;

      const story = parseMarkdownStory(markdown);
      
      expect(story.meta.title).toBe("Untitled Story");
      expect(story.meta.author).toBe("Unknown");
      expect(story.meta.description).toBe("");
    });

    it("concatenates multi-line subtitles", () => {
      const markdown = `
# Title: Story
# Author: Author

## node:scene:video
This is line one.
This is line two.
-> next | Continue | next_scene
`;

      const story = parseMarkdownStory(markdown);
      
      expect(story.nodes[0].subtitle).toBe("This is line one. This is line two.");
    });
  });

  describe("storyToMarkdown", () => {
    it("converts a story back to markdown", () => {
      const story = {
        meta: {
          title: "My Story",
          author: "Me",
          description: "A story",
          version: "1.0.0",
          date: "2024-01-01",
        },
        config: {
          videoBasePath: "videos",
          preloadNext: true,
          defaultVolume: 1.0,
        },
        startNodeId: "intro",
        nodes: [
          {
            id: "intro",
            title: "Intro",
            type: "start" as const,
            videoFile: "intro.mp4",
            subtitle: "Welcome!",
            choices: [
              { id: "go", label: "Go", targetNodeId: "end" },
            ],
          },
          {
            id: "end",
            title: "End",
            type: "ending" as const,
            videoFile: "end.mp4",
            choices: [],
          },
        ],
      };

      const markdown = storyToMarkdown(story);
      
      expect(markdown).toContain("# Title: My Story");
      expect(markdown).toContain("# Author: Me");
      expect(markdown).toContain("## node:intro:start");
      expect(markdown).toContain("Welcome!");
      expect(markdown).toContain("-> go | Go | end");
    });
  });

  describe("validateMarkdownStory", () => {
    it("returns errors for missing required fields", () => {
      const markdown = `
## node:test:start
Content.
`;

      const errors = validateMarkdownStory(markdown);
      
      expect(errors).toContain("Missing required field: # Title:");
      expect(errors).toContain("Missing required field: # Author:");
    });

    it("returns error for no nodes", () => {
      const markdown = `
# Title: Story
# Author: Author
`;

      const errors = validateMarkdownStory(markdown);
      
      expect(errors).toContain("No nodes defined. Use '## node:id:type' syntax.");
    });

    it("returns empty array for valid story", () => {
      const markdown = `
# Title: Story
# Author: Author

## node:test:start
Content.
`;

      const errors = validateMarkdownStory(markdown);
      
      expect(errors).toHaveLength(0);
    });
  });
});
