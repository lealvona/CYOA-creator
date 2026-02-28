/**
 * Story Validation Utility
 *
 * Validates a StoryDefinition for structural correctness:
 *  - Required fields present
 *  - Start node exists and is type "start"
 *  - All choice targets reference existing nodes
 *  - No orphan nodes (unreachable from start)
 *  - Ending nodes have no choices
 *  - No duplicate node/choice IDs
 *
 * Returns an array of validation issues. Empty array = valid.
 */

import type { StoryDefinition, StoryNode } from "../types/story";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  nodeId?: string;
  choiceId?: string;
}

export function validateStory(story: StoryDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // ---- Top-level fields ----

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
    return issues; // Can't continue without nodes
  }

  // ---- Build node index ----

  const nodeMap = new Map<string, StoryNode>();
  const duplicateIds = new Set<string>();

  for (const node of story.nodes) {
    if (nodeMap.has(node.id)) {
      duplicateIds.add(node.id);
    }
    nodeMap.set(node.id, node);
  }

  for (const id of duplicateIds) {
    issues.push({
      severity: "error",
      message: `Duplicate node ID: "${id}"`,
      nodeId: id,
    });
  }

  // ---- Start node ----

  const startNode = nodeMap.get(story.startNodeId);
  if (!startNode) {
    issues.push({
      severity: "error",
      message: `Start node "${story.startNodeId}" does not exist`,
    });
  } else if (startNode.type !== "start") {
    issues.push({
      severity: "warning",
      message: `Start node "${story.startNodeId}" has type "${startNode.type}" instead of "start"`,
      nodeId: story.startNodeId,
    });
  }

  // ---- Per-node validation ----

  for (const node of story.nodes) {
    // Required fields
    if (!node.id) {
      issues.push({ severity: "error", message: "Node missing id" });
      continue;
    }

    if (!node.videoFile) {
      issues.push({
        severity: "error",
        message: `Node "${node.id}" missing videoFile`,
        nodeId: node.id,
      });
    }

    if (!node.title) {
      issues.push({
        severity: "warning",
        message: `Node "${node.id}" missing title`,
        nodeId: node.id,
      });
    }

    // Ending nodes should not have choices
    if (node.type === "ending" && node.choices.length > 0) {
      issues.push({
        severity: "warning",
        message: `Ending node "${node.id}" has ${node.choices.length} choice(s) — they will be ignored`,
        nodeId: node.id,
      });
    }

    // Non-ending nodes should have choices (unless it's the start with auto-play)
    if (node.type === "video" && node.choices.length === 0) {
      issues.push({
        severity: "warning",
        message: `Video node "${node.id}" has no choices — will act as a dead end`,
        nodeId: node.id,
      });
    }

    // Validate each choice
    const choiceIds = new Set<string>();
    for (const choice of node.choices) {
      if (!choice.id) {
        issues.push({
          severity: "error",
          message: `Choice on node "${node.id}" missing id`,
          nodeId: node.id,
        });
        continue;
      }

      if (choiceIds.has(choice.id)) {
        issues.push({
          severity: "error",
          message: `Duplicate choice ID "${choice.id}" on node "${node.id}"`,
          nodeId: node.id,
          choiceId: choice.id,
        });
      }
      choiceIds.add(choice.id);

      if (!choice.label) {
        issues.push({
          severity: "warning",
          message: `Choice "${choice.id}" on node "${node.id}" missing label`,
          nodeId: node.id,
          choiceId: choice.id,
        });
      }

      if (!choice.targetNodeId) {
        issues.push({
          severity: "error",
          message: `Choice "${choice.id}" on node "${node.id}" missing targetNodeId`,
          nodeId: node.id,
          choiceId: choice.id,
        });
      } else if (!nodeMap.has(choice.targetNodeId)) {
        issues.push({
          severity: "error",
          message: `Choice "${choice.id}" on node "${node.id}" targets non-existent node "${choice.targetNodeId}"`,
          nodeId: node.id,
          choiceId: choice.id,
        });
      }
    }
  }

  // ---- Reachability analysis ----

  if (startNode) {
    const reachable = new Set<string>();
    const queue = [story.startNodeId];

    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);

      const node = nodeMap.get(id);
      if (node) {
        for (const choice of node.choices) {
          if (choice.targetNodeId && !reachable.has(choice.targetNodeId)) {
            queue.push(choice.targetNodeId);
          }
        }
      }
    }

    for (const node of story.nodes) {
      if (!reachable.has(node.id)) {
        issues.push({
          severity: "warning",
          message: `Node "${node.id}" is unreachable from the start node`,
          nodeId: node.id,
        });
      }
    }
  }

  // ---- Check for at least one ending ----

  const endings = story.nodes.filter((n) => n.type === "ending");
  if (endings.length === 0) {
    issues.push({
      severity: "warning",
      message: "Story has no ending nodes — the story may never conclude",
    });
  }

  return issues;
}

/**
 * Convenience function: validate and throw if there are errors.
 */
export function assertStoryValid(story: StoryDefinition): void {
  const issues = validateStory(story);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (warnings.length > 0) {
    console.warn(
      `[Story Validation] ${warnings.length} warning(s):`,
      warnings.map((w) => w.message)
    );
  }

  if (errors.length > 0) {
    const summary = errors.map((e) => `  - ${e.message}`).join("\n");
    throw new Error(
      `Story validation failed with ${errors.length} error(s):\n${summary}`
    );
  }
}
