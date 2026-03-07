import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { addStoryToCatalog, getCatalog } from "./catalog-store.mjs";
import { DATA_DIR, LIMITS, PORT, STORIES_DIR, TMP_DIR } from "./constants.mjs";
import { importZipPackage } from "./zip-importer.mjs";

const app = express();

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(STORIES_DIR, { recursive: true });
await fs.mkdir(TMP_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/stories-imported", express.static(STORIES_DIR));

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: LIMITS.maxZipBytes, files: 1 },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/stories", async (_req, res) => {
  const stories = await getCatalog();
  res.json({ stories });
});

app.post("/api/import", upload.single("package"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, error: "Missing uploaded zip file" });
    return;
  }

  const tempPath = path.resolve(req.file.path);
  console.log(`Importing package: ${tempPath}, size: ${req.file.size} bytes`);

  try {
    const result = await importZipPackage(tempPath);
    console.log(`Import successful: ${result.story.id}`);
    await addStoryToCatalog(result.story);

    res.status(201).json({
      ok: true,
      story: result.story,
      warnings: result.warnings,
    });
  } catch (err) {
    console.error(`Import failed:`, err);
    res.status(400).json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to import package",
    });
  } finally {
    await fs.rm(tempPath, { force: true });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({
    ok: false,
    error: err instanceof Error ? err.message : "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`CYOA import API running on http://localhost:${PORT}`);
});
