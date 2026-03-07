import { useEffect, useState, type FC } from "react";
import type { StoryCatalogItem } from "../types/library";
import { fetchAllStories, importStoryZipWithProgress } from "../utils/storyApi";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { MarkdownStoryCreator } from "./MarkdownStoryCreator";
import type { StoryDefinition } from "../types/story";
import "./StoryLibrary.css";

export interface StoryLibraryProps {
  onOpenStory: (story: StoryCatalogItem) => void;
  onViewAnalytics?: (story: StoryCatalogItem) => void;
}

export const StoryLibrary: FC<StoryLibraryProps> = ({ onOpenStory, onViewAnalytics }) => {
  const [stories, setStories] = useState<StoryCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showMarkdownCreator, setShowMarkdownCreator] = useState(false);
  const { currentTheme, isThemeSwitchingAllowed, isDarkModeEnabled } = useTheme();

  const loadStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allStories = await fetchAllStories();
      setStories(allStories);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch story catalog";
      setError(message);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStories();
  }, []);

  const handleMarkdownStoryCreated = async (story: StoryDefinition, filename: string) => {
    // Convert the story definition to a JSON blob
    const storyJson = JSON.stringify(story, null, 2);
    const blob = new Blob([storyJson], { type: "application/json" });
    
    // Create a minimal ZIP structure (just the story.json for now)
    // In a full implementation, we'd create a proper ZIP with videos
    // For now, we'll just download the JSON so the user can package it themselves
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setImportStatus(`Story "${story.meta.title}" created! Downloaded as ${filename}.json`);
    setShowMarkdownCreator(false);
    
    // Note: To actually use this story, it needs to be:
    // 1. Packaged as a ZIP with videos
    // 2. Uploaded via the import feature
    // 3. Or placed in the stories directory with the API server running
  };

  const visibleStories = stories;

  if (showMarkdownCreator) {
    return (
      <main className="story-library">
        <header className="story-library__header">
          <div className="story-library__header-left">
            <img 
              src={currentTheme.assets.logo} 
              alt={`${currentTheme.meta.appName} logo`}
              className="story-library__logo"
              width="40"
              height="40"
            />
            <div>
              <h1>{currentTheme.meta.appName}</h1>
              <p>Create Story from Markdown</p>
            </div>
          </div>
        </header>
        
        <MarkdownStoryCreator
          onStoryCreated={handleMarkdownStoryCreated}
          onCancel={() => setShowMarkdownCreator(false)}
        />
        
        {importStatus && (
          <div className="story-library__status-container">
            <p className="story-library__status">{importStatus}</p>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="story-library">
      <header className="story-library__header">
        <div className="story-library__header-left">
          <img 
            src={currentTheme.assets.logo} 
            alt={`${currentTheme.meta.appName} logo`}
            className="story-library__logo"
            width="40"
            height="40"
          />
          <div>
            <h1>{currentTheme.meta.appName}</h1>
            <p>{currentTheme.meta.tagline}</p>
          </div>
        </div>
        {(isThemeSwitchingAllowed || isDarkModeEnabled) && (
          <div className="story-library__header-right">
            <ThemeToggle variant="dropdown" />
          </div>
        )}
      </header>

      <section className="story-library__import">
        <h3>Import Story</h3>
        <label htmlFor="story-package">Import story package (.zip)</label>
        <input
          id="story-package"
          type="file"
          accept=".zip"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            setUploadProgress(0);
            setImportStatus("Uploading package... 0%");
            const result = await importStoryZipWithProgress(file, (pct) => {
              setUploadProgress(pct);
              if (pct >= 100) {
                setImportStatus("Processing package...");
              } else {
                setImportStatus(`Uploading package... ${pct}%`);
              }
            });
            if (!result.ok) {
              setImportStatus(`Import failed: ${result.error ?? "Unknown error"}`);
              return;
            }

            const warnings = result.warnings?.length
              ? ` (warnings: ${result.warnings.join("; ")})`
              : "";
            setImportStatus(`Import complete${warnings}`);
            await loadStories();
            if (result.story) {
              onOpenStory(result.story);
            }
          }}
        />
        {importStatus && <p className="story-library__status">{importStatus}</p>}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <progress max={100} value={uploadProgress} />
        )}
      </section>

      <section className="story-library__create">
        <h3>Create Story</h3>
        <p>Write your story in markdown format and convert it to JSON.</p>
        <button 
          className="story-library__create-btn"
          onClick={() => setShowMarkdownCreator(true)}
        >
          Create from Markdown
        </button>
      </section>

      {isLoading ? (
        <p className="story-library__status">Loading stories...</p>
      ) : (
        <section className="story-library__grid">
          {visibleStories.map((story) => (
            <article className="story-library__card" key={`${story.id}-${story.storyUrl}`}>
              <div className="story-library__card-meta">
                <h2>{story.meta.title}</h2>
                <p>{story.meta.description}</p>
                <small>
                  {story.meta.author} · v{story.meta.version}
                </small>
                <small>
                  {story.completeness === "complete"
                    ? "Complete package"
                    : "Incomplete package (playable draft)"}
                </small>
              </div>
              <div className="story-library__card-actions">
                <button onClick={() => onOpenStory(story)}>Play</button>
                {onViewAnalytics && (
                  <button 
                    className="story-library__analytics-btn"
                    onClick={() => onViewAnalytics(story)}
                  >
                    Analytics
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {error && <p className="story-library__error">{error}</p>}
    </main>
  );
};
