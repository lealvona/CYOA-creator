import type { ImportStoryResponse, StoryCatalogItem } from "../types/library";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export async function fetchStoryCatalog(): Promise<StoryCatalogItem[]> {
  const response = await fetch(`${API_BASE}/api/stories`);
  if (!response.ok) {
    throw new Error(`Failed to load stories: ${response.status}`);
  }
  const payload = (await response.json()) as { stories: StoryCatalogItem[] };
  return payload.stories;
}

export interface BundledStoryIndex {
  stories: Array<{
    id: string;
    storyUrl: string;
    completeness?: "complete" | "incomplete";
  }>;
}

async function fetchBundledStories(): Promise<StoryCatalogItem[]> {
  try {
    const response = await fetch("/stories/index.json");
    if (!response.ok) {
      return [];
    }
    const index = (await response.json()) as BundledStoryIndex;

    const results = await Promise.all(
      index.stories.map(async (bundled): Promise<StoryCatalogItem | null> => {
        try {
          const storyResponse = await fetch(bundled.storyUrl);
          if (!storyResponse.ok) {
            return null;
          }
          const storyDef = await storyResponse.json();
          return {
            id: bundled.id,
            storyUrl: bundled.storyUrl,
            importedAt: new Date().toISOString(),
            completeness: bundled.completeness ?? "complete",
            meta: storyDef.meta,
          };
        } catch {
          return null;
        }
      })
    );

    return results.filter((s): s is StoryCatalogItem => s !== null);
  } catch {
    return [];
  }
}

export async function fetchAllStories(): Promise<StoryCatalogItem[]> {
  const [bundled, imported] = await Promise.all([
    fetchBundledStories(),
    fetchStoryCatalog().catch(() => []),
  ]);

  const merged = [...bundled];
  for (const imp of imported) {
    if (!merged.some((b) => b.id === imp.id && b.storyUrl === imp.storyUrl)) {
      merged.push(imp);
    }
  }

  return merged;
}

export async function importStoryZip(file: File): Promise<ImportStoryResponse> {
  return importStoryZipWithProgress(file);
}

export function importStoryZipWithProgress(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<ImportStoryResponse> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append("package", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/import`);

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      onProgress(Math.min(100, Math.max(0, pct)));
    };

    xhr.onerror = () => {
      resolve({ ok: false, error: "Network error during import" });
    };

    xhr.onload = () => {
      let payload: ImportStoryResponse = { ok: false, error: "Invalid response" };
      try {
        payload = JSON.parse(xhr.responseText) as ImportStoryResponse;
      } catch {
        // ignored
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        resolve({
          ok: false,
          error: payload.error ?? `Import failed: ${xhr.status}`,
          warnings: payload.warnings,
        });
        return;
      }

      resolve(payload);
    };

    xhr.send(formData);
  });
}
