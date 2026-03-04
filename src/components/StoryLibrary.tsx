import { useEffect, useState, type FC } from "react";
import type { StoryCatalogItem } from "../types/library";
import { fetchAllStories, importStoryZipWithProgress } from "../utils/storyApi";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import "./StoryLibrary.css";

export interface StoryLibraryProps {
  onOpenStory: (story: StoryCatalogItem) => void;
}

export const StoryLibrary: FC<StoryLibraryProps> = ({ onOpenStory }) => {
  const [stories, setStories] = useState<StoryCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
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

  const visibleStories = stories;

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
              <button onClick={() => onOpenStory(story)}>Play</button>
            </article>
          ))}
        </section>
      )}

      {error && <p className="story-library__error">{error}</p>}
    </main>
  );
};
