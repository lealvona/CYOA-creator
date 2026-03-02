import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { StoryCatalogItem } from "../types/library";
import { StoryLibrary } from "./StoryLibrary";

const apiMocks = vi.hoisted(() => {
  return {
    fetchStoryCatalog: vi.fn(),
    importStoryZipWithProgress: vi.fn(),
  };
});

vi.mock("../utils/storyApi", () => ({
  fetchStoryCatalog: apiMocks.fetchStoryCatalog,
  importStoryZipWithProgress: apiMocks.importStoryZipWithProgress,
}));

const importedStory: StoryCatalogItem = {
  id: "imported-1",
  storyUrl: "/stories-imported/imported-1/story.json",
  importedAt: new Date().toISOString(),
  completeness: "incomplete",
  meta: {
    title: "Imported Draft",
    description: "draft",
    author: "tester",
    version: "1.0.0",
  },
};

describe("StoryLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders fallback sample and opens it", async () => {
    apiMocks.fetchStoryCatalog.mockResolvedValue([]);
    const onOpenStory = vi.fn();

    render(<StoryLibrary onOpenStory={onOpenStory} />);

    expect(await screen.findByText("The Forgotten Lab")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Play" }));

    expect(onOpenStory).toHaveBeenCalledTimes(1);
    const arg = onOpenStory.mock.calls[0][0] as StoryCatalogItem;
    expect(arg.storyUrl).toBe("/stories/sample/story.json");
  });

  it("imports zip with progress and auto-opens imported story", async () => {
    apiMocks.fetchStoryCatalog.mockResolvedValue([importedStory]);
    apiMocks.importStoryZipWithProgress.mockImplementation(
      async (_file: File, onProgress?: (progressPercent: number) => void) => {
        onProgress?.(50);
        onProgress?.(100);
        return {
          ok: true,
          story: importedStory,
          warnings: ["missing clips"],
        };
      }
    );

    const onOpenStory = vi.fn();
    render(<StoryLibrary onOpenStory={onOpenStory} />);

    const input = await screen.findByLabelText("Import story package (.zip)");
    const file = new File(["zip"], "story.zip", { type: "application/zip" });
    await userEvent.upload(input, file);

    expect(await screen.findByText(/Import complete/)).toBeInTheDocument();
    await waitFor(() => {
      expect(onOpenStory).toHaveBeenCalledWith(importedStory);
    });
  });
});
