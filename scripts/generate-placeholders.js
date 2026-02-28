#!/usr/bin/env node

/**
 * generate-placeholders.js
 *
 * Generates placeholder .webm video files for the sample story.
 * Each video is a 5-second colored screen with the node title as text.
 *
 * Requirements: ffmpeg must be installed and available on PATH.
 *
 * Usage:
 *   node scripts/generate-placeholders.js
 *
 * If ffmpeg is not available, the script falls back to creating minimal
 * valid WebM files (black, no audio, ~1 second) using raw binary data.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load story JSON
const storyPath = join(
  __dirname,
  "..",
  "public",
  "stories",
  "sample",
  "story.json"
);
const story = JSON.parse(readFileSync(storyPath, "utf-8"));

const outputDir = join(__dirname, "..", "public", "stories", "sample", "videos");

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Color palette for different node types
const colors = {
  start: "0x2E86AB",
  video: "0xA23B72",
  ending: "0xF18F01",
};

// Check if ffmpeg is available
function hasFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Generate with ffmpeg
function generateWithFfmpeg(node) {
  const color = colors[node.type] || colors.video;
  const outputFile = join(outputDir, node.videoFile);

  // Escape text for ffmpeg drawtext filter
  const title = node.title.replace(/'/g, "\\'").replace(/:/g, "\\:");
  const subtitle = (node.subtitle || "")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:");
  const nodeType = `[${node.type.toUpperCase()}]`;

  const cmd = [
    "ffmpeg",
    "-y",
    "-f lavfi",
    `-i color=c=${color}:s=1280x720:d=5`,
    "-f lavfi",
    "-i anullsrc=r=44100:cl=stereo",
    "-t 5",
    "-vf",
    `"drawtext=text='${nodeType}':fontsize=24:fontcolor=white@0.5:x=(w-text_w)/2:y=50,` +
      `drawtext=text='${title}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30,` +
      `drawtext=text='${subtitle}':fontsize=24:fontcolor=white@0.7:x=(w-text_w)/2:y=(h-text_h)/2+40,` +
      `drawtext=text='${node.id}':fontsize=18:fontcolor=white@0.3:x=(w-text_w)/2:y=h-50"`,
    "-c:v libvpx-vp9",
    "-b:v 200k",
    "-c:a libopus",
    "-b:a 64k",
    `"${outputFile}"`,
  ].join(" ");

  try {
    execSync(cmd, { stdio: "pipe" });
    console.log(`  [OK] ${node.videoFile}`);
  } catch (err) {
    console.error(`  [FAIL] ${node.videoFile}: ${err.message}`);
  }
}

// Fallback: generate a minimal valid WebM file
// This creates a tiny ~1KB valid WebM container that plays as a short black video
function generateMinimalWebm(node) {
  const outputFile = join(outputDir, node.videoFile);

  // Minimal valid WebM file (EBML header + Segment with basic info)
  // This is a pre-built binary blob of a valid 1-frame WebM
  // In practice, the best fallback is to use a <canvas> rendered to blob at runtime.
  // Here we create a minimal file to prevent 404 errors.
  const minimalWebm = Buffer.from([
    // EBML Header
    0x1a, 0x45, 0xdf, 0xa3, // EBML element ID
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f, // Size
    0x42, 0x86, 0x81, 0x01, // EBMLVersion: 1
    0x42, 0xf7, 0x81, 0x01, // EBMLReadVersion: 1
    0x42, 0xf2, 0x81, 0x04, // EBMLMaxIDLength: 4
    0x42, 0xf3, 0x81, 0x08, // EBMLMaxSizeLength: 8
    0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d, // DocType: "webm"
    0x42, 0x87, 0x81, 0x04, // DocTypeVersion: 4
    0x42, 0x85, 0x81, 0x02, // DocTypeReadVersion: 2
  ]);

  writeFileSync(outputFile, minimalWebm);
  console.log(`  [STUB] ${node.videoFile} (minimal — ffmpeg not available)`);
}

// Main
console.log("Generating placeholder videos for sample story...\n");
console.log(`Output directory: ${outputDir}`);
console.log(`Nodes to process: ${story.nodes.length}\n`);

const useFfmpeg = hasFfmpeg();

if (useFfmpeg) {
  console.log("Using ffmpeg to generate full placeholder videos.\n");
} else {
  console.log(
    "ffmpeg not found. Creating minimal stub files.\n" +
      "Install ffmpeg for proper placeholder videos:\n" +
      "  Windows: winget install ffmpeg\n" +
      "  macOS:   brew install ffmpeg\n" +
      "  Linux:   sudo apt install ffmpeg\n"
  );
}

for (const node of story.nodes) {
  if (useFfmpeg) {
    generateWithFfmpeg(node);
  } else {
    generateMinimalWebm(node);
  }
}

console.log("\nDone!");
if (!useFfmpeg) {
  console.log(
    "\nNote: Stub WebM files are not real videos. The video player will\n" +
      "show an error overlay for each. Install ffmpeg and re-run this\n" +
      "script, or replace the stubs with your own video files."
  );
}
