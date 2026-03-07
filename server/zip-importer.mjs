import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import yauzl from "yauzl";
import { pipeline } from "node:stream/promises";
import { v4 as uuidv4 } from "uuid";
import { LIMITS, STORIES_DIR } from "./constants.mjs";
import { validateStoryShape } from "./validate-story.mjs";

function normalizeEntryPath(entryName) {
  const normalized = path.posix.normalize(entryName.replace(/\\/g, "/"));
  if (normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Unsafe path traversal detected: ${entryName}`);
  }
  if (path.isAbsolute(normalized) || normalized.startsWith("/")) {
    throw new Error(`Absolute paths are not allowed: ${entryName}`);
  }
  if (normalized === "" || normalized === ".") {
    throw new Error(`Invalid zip entry path: ${entryName}`);
  }
  return normalized;
}

function isAllowedEntry(entryPath) {
  return (
    entryPath === "story.json" ||
    entryPath === "package.manifest.json" ||
    entryPath.startsWith("videos/")
  );
}

async function writeEntry(zipfile, entry, outputPath) {
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });

  await new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, async (openErr, readStream) => {
      if (openErr) {
        reject(openErr);
        return;
      }
      if (!readStream) {
        reject(new Error(`Missing read stream for ${entry.fileName}`));
        return;
      }

      try {
        await pipeline(readStream, fs.createWriteStream(outputPath));
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function processEntry(zipfile, entry, storyDir, state) {
  state.entryCount += 1;
  if (state.entryCount > LIMITS.maxEntries) {
    throw new Error("Zip rejected: too many files");
  }

  state.expandedBytes += Number(entry.uncompressedSize || 0);
  if (state.expandedBytes > LIMITS.maxExpandedBytes) {
    throw new Error("Zip rejected: uncompressed size exceeds limit");
  }

  const normalizedPath = normalizeEntryPath(entry.fileName);
  if (!isAllowedEntry(normalizedPath)) {
    throw new Error(`Unexpected file in package: ${normalizedPath}`);
  }

  if (/\/$/.test(entry.fileName)) {
    await fsp.mkdir(path.join(storyDir, normalizedPath), { recursive: true });
    return;
  }

  const outputPath = path.join(storyDir, normalizedPath);
  await writeEntry(zipfile, entry, outputPath);
}

export async function importZipPackage(zipPath) {
  await fsp.mkdir(STORIES_DIR, { recursive: true });

  const storyId = uuidv4();
  const storyDir = path.join(STORIES_DIR, storyId);
  await fsp.mkdir(storyDir, { recursive: true });

  const state = { entryCount: 0, expandedBytes: 0 };

  await new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (openErr, zipfile) => {
      if (openErr || !zipfile) {
        reject(openErr ?? new Error("Failed to open zip file"));
        return;
      }

      const processNext = () => {
        try {
          zipfile.readEntry();
        } catch (err) {
          zipfile.close();
          reject(err);
        }
      };

      zipfile.on("entry", (entry) => {
        processEntry(zipfile, entry, storyDir, state)
          .then(() => processNext())
          .catch((err) => {
            zipfile.close();
            reject(err);
          });
      });

      zipfile.on("end", resolve);
      zipfile.on("error", reject);
      processNext();
    });
  });

  const storyPath = path.join(storyDir, "story.json");
  const storyRaw = await fsp.readFile(storyPath, "utf8");
  const story = JSON.parse(storyRaw);

  const shapeIssues = validateStoryShape(story);
  if (shapeIssues.length > 0) {
    throw new Error(`Story validation failed: ${shapeIssues.join("; ")}`);
  }

  const missingVideos = story.nodes
    .filter((node) => !fs.existsSync(path.join(storyDir, "videos", node.videoFile)))
    .map((node) => node.videoFile);

  const completeness = missingVideos.length > 0 ? "incomplete" : "complete";

  const importedAt = new Date().toISOString();
  const storyUrl = `/stories-imported/${storyId}/story.json`;

  if (story.config?.videoBasePath) {
    story.config.videoBasePath = `/stories-imported/${storyId}/videos`;
    await fsp.writeFile(storyPath, JSON.stringify(story, null, 2));
  }

  return {
    story: {
      id: storyId,
      storyUrl,
      importedAt,
      completeness,
      meta: {
        title: story.meta.title,
        description: story.meta.description,
        author: story.meta.author,
        version: story.meta.version,
        estimatedMinutes: story.meta.estimatedMinutes,
        tags: story.meta.tags,
      },
    },
    warnings:
      missingVideos.length > 0
        ? [
            `Package incomplete: ${missingVideos.length} referenced video files are missing`,
          ]
        : [],
  };
}
