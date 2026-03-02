#!/usr/bin/env node

import { zipSync, strToU8 } from "fflate";

const API = process.env.CYOA_API_BASE || "http://localhost:8787";

function createZipFromStory(story) {
  return zipSync({
    "story.json": strToU8(JSON.stringify(story, null, 2)),
  });
}

async function importZip(bytes, fileName) {
  const form = new FormData();
  form.append("package", new Blob([bytes], { type: "application/zip" }), fileName);
  const response = await fetch(`${API}/api/import`, {
    method: "POST",
    body: form,
  });
  const payload = await response.json();
  return { response, payload };
}

async function main() {
  const missingStartNodeStory = {
    meta: { title: "Bad", description: "x", author: "x", version: "1", date: "2026-03-02" },
    config: { videoBasePath: "videos" },
    startNodeId: "missing",
    nodes: [
      {
        id: "intro",
        title: "Intro",
        type: "start",
        videoFile: "intro.mp4",
        choices: [],
      },
    ],
  };

  const badTargetStory = {
    meta: { title: "Bad2", description: "x", author: "x", version: "1", date: "2026-03-02" },
    config: { videoBasePath: "videos" },
    startNodeId: "intro",
    nodes: [
      {
        id: "intro",
        title: "Intro",
        type: "start",
        videoFile: "intro.mp4",
        choices: [{ id: "c1", label: "Broken", targetNodeId: "ghost" }],
      },
    ],
  };

  const first = await importZip(
    createZipFromStory(missingStartNodeStory),
    "invalid-missing-start.zip"
  );

  if (first.response.ok) {
    throw new Error("Expected missing start node story import to fail");
  }

  const second = await importZip(
    createZipFromStory(badTargetStory),
    "invalid-target.zip"
  );

  if (second.response.ok) {
    throw new Error("Expected invalid target node story import to fail");
  }

  console.log("E2E invalid story import tests passed", {
    missingStartStatus: first.response.status,
    badTargetStatus: second.response.status,
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
