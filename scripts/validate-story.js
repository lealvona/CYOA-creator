#!/usr/bin/env node

/**
 * validate-story.js
 *
 * CLI utility to validate a story JSON file against the schema rules.
 * Checks for structural issues, broken references, unreachable nodes, etc.
 *
 * Usage:
 *   node scripts/validate-story.js [path-to-story.json]
 *
 * Defaults to: public/stories/sample/story.json
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---- Inline validation logic (mirrors src/utils/validateStory.ts) ----
// We duplicate here to avoid needing a TypeScript build step for the CLI.

function validateStory(story) {
  const issues = [];

  if (!story.meta?.title) {
    issues.push({ severity: "error", message: "Missing meta.title" });
  }
  if (!story.config?.videoBasePath) {
    issues.push({ severity: "error", message: "Missing config.videoBasePath" });
  }
  if (!story.startNodeId) {
    issues.push({ severity: "error", message: "Missing startNodeId" });
  }
  if (!story.nodes || story.nodes.length === 0) {
    issues.push({ severity: "error", message: "Story has no nodes" });
    return issues;
  }

  const nodeMap = new Map();
  const duplicateIds = new Set();

  for (const node of story.nodes) {
    if (nodeMap.has(node.id)) duplicateIds.add(node.id);
    nodeMap.set(node.id, node);
  }

  for (const id of duplicateIds) {
    issues.push({ severity: "error", message: `Duplicate node ID: "${id}"`, nodeId: id });
  }

  const startNode = nodeMap.get(story.startNodeId);
  if (!startNode) {
    issues.push({ severity: "error", message: `Start node "${story.startNodeId}" does not exist` });
  } else if (startNode.type !== "start") {
    issues.push({ severity: "warning", message: `Start node has type "${startNode.type}" instead of "start"`, nodeId: story.startNodeId });
  }

  for (const node of story.nodes) {
    if (!node.id) {
      issues.push({ severity: "error", message: "Node missing id" });
      continue;
    }
    if (!node.videoFile) {
      issues.push({ severity: "error", message: `Node "${node.id}" missing videoFile`, nodeId: node.id });
    }
    if (!node.title) {
      issues.push({ severity: "warning", message: `Node "${node.id}" missing title`, nodeId: node.id });
    }
    if (node.type === "ending" && node.choices?.length > 0) {
      issues.push({ severity: "warning", message: `Ending node "${node.id}" has choices`, nodeId: node.id });
    }
    if (node.type === "video" && (!node.choices || node.choices.length === 0)) {
      issues.push({ severity: "warning", message: `Video node "${node.id}" has no choices`, nodeId: node.id });
    }

    const choiceIds = new Set();
    for (const choice of node.choices || []) {
      if (!choice.id) {
        issues.push({ severity: "error", message: `Choice on "${node.id}" missing id`, nodeId: node.id });
        continue;
      }
      if (choiceIds.has(choice.id)) {
        issues.push({ severity: "error", message: `Duplicate choice "${choice.id}" on "${node.id}"`, nodeId: node.id });
      }
      choiceIds.add(choice.id);
      if (!choice.targetNodeId) {
        issues.push({ severity: "error", message: `Choice "${choice.id}" missing targetNodeId`, nodeId: node.id });
      } else if (!nodeMap.has(choice.targetNodeId)) {
        issues.push({ severity: "error", message: `Choice "${choice.id}" targets non-existent "${choice.targetNodeId}"`, nodeId: node.id });
      }
    }
  }

  // Reachability
  if (startNode) {
    const reachable = new Set();
    const queue = [story.startNodeId];
    while (queue.length > 0) {
      const id = queue.shift();
      if (reachable.has(id)) continue;
      reachable.add(id);
      const node = nodeMap.get(id);
      if (node) {
        for (const choice of node.choices || []) {
          if (choice.targetNodeId && !reachable.has(choice.targetNodeId)) {
            queue.push(choice.targetNodeId);
          }
        }
      }
    }
    for (const node of story.nodes) {
      if (!reachable.has(node.id)) {
        issues.push({ severity: "warning", message: `Node "${node.id}" is unreachable`, nodeId: node.id });
      }
    }
  }

  const endings = story.nodes.filter((n) => n.type === "ending");
  if (endings.length === 0) {
    issues.push({ severity: "warning", message: "No ending nodes" });
  }

  return issues;
}

// ---- CLI ----

const args = process.argv.slice(2);
const storyFile = args[0]
  ? resolve(args[0])
  : join(__dirname, "..", "public", "stories", "sample", "story.json");

if (!existsSync(storyFile)) {
  console.error(`File not found: ${storyFile}`);
  process.exit(1);
}

let story;
try {
  story = JSON.parse(readFileSync(storyFile, "utf-8"));
} catch (err) {
  console.error(`Invalid JSON: ${err.message}`);
  process.exit(1);
}

console.log(`Validating: ${storyFile}\n`);

const issues = validateStory(story);
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

if (errors.length > 0) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) {
    console.log(`  [ERR]  ${e.message}${e.nodeId ? ` (node: ${e.nodeId})` : ""}`);
  }
}

if (warnings.length > 0) {
  console.log(`\nWARNINGS (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [WARN] ${w.message}${w.nodeId ? ` (node: ${w.nodeId})` : ""}`);
  }
}

if (issues.length === 0) {
  console.log("No issues found. Story is valid.");

  // Print stats
  const nodeCount = story.nodes.length;
  const endingCount = story.nodes.filter((n) => n.type === "ending").length;
  const choiceCount = story.nodes.reduce((sum, n) => sum + (n.choices?.length || 0), 0);

  console.log(`\nStats:`);
  console.log(`  Nodes:   ${nodeCount}`);
  console.log(`  Endings: ${endingCount}`);
  console.log(`  Choices: ${choiceCount}`);
} else {
  console.log(`\nTotal: ${errors.length} error(s), ${warnings.length} warning(s)`);
}

process.exit(errors.length > 0 ? 1 : 0);
