#!/usr/bin/env node

import { zipSync, strToU8 } from "fflate";

const API = process.env.CYOA_API_BASE || "http://localhost:8787";

function buildZip(entries) {
  return zipSync(entries);
}

async function postZip(zipBytes, fileName) {
  const form = new FormData();
  form.append("package", new Blob([zipBytes], { type: "application/zip" }), fileName);
  const response = await fetch(`${API}/api/import`, { method: "POST", body: form });
  let json = {};
  try {
    json = await response.json();
  } catch {
    // ignored
  }
  return { response, json };
}

async function main() {
  // 1) path traversal attempt should be rejected
  const traversalZip = buildZip({
    "../story.json": strToU8("{}"),
  });

  const traversal = await postZip(traversalZip, "path-traversal.zip");
  if (traversal.response.ok) {
    throw new Error("Expected path traversal zip to be rejected");
  }

  // 2) unexpected top-level file should be rejected
  const extraFileZip = buildZip({
    "story.json": strToU8(
      JSON.stringify({
        meta: { title: "x", description: "x", author: "x", version: "1", date: "2026-03-02" },
        config: { videoBasePath: "videos" },
        startNodeId: "s",
        nodes: [{ id: "s", title: "s", type: "start", videoFile: "s.mp4", choices: [] }],
      })
    ),
    "hacker.txt": strToU8("not allowed"),
  });

  const extra = await postZip(extraFileZip, "unexpected-file.zip");
  if (extra.response.ok) {
    throw new Error("Expected unexpected-file zip to be rejected");
  }

  console.log("E2E import security smoke tests passed", {
    traversalStatus: traversal.response.status,
    unexpectedFileStatus: extra.response.status,
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
