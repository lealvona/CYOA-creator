import type { StoryDefinition, StoryMeta, StoryConfig, StoryNode, Choice } from "../types/story";

/**
 * Parse structured markdown format into a StoryDefinition.
 * 
 * Markdown Format:
 * ```
 * # Title: Story Name
 * # Author: Creator Name
 * # Description: Brief description of the story
 * 
 * ## node:intro:start
 * Welcome to the adventure!
 * -> go_left | Go left | left_room
 * -> go_right | Go right | right_room
 * 
 * ## node:left_room:video
 * You enter a dark room.
 * -> explore | Look around | exploration
 * -> leave | Go back | intro
 * 
 * ## node:exploration:ending
 * You found treasure!
 * ```
 * 
 * Node syntax: ## node:{id}:{type}
 * - id: unique identifier (used for video filename: {id}.mp4)
 * - type: "start", "video", or "ending"
 * 
 * Choice syntax: -> {choice_id} | {label} | {target_node_id}
 */
export function parseMarkdownStory(input: string): StoryDefinition {
  const lines = input.split("\n");
  
  // Extract metadata
  const title = lines
    .find((line) => line.startsWith("# Title:"))
    ?.substring(8)
    .trim() || "Untitled Story";
  
  const author = lines
    .find((line) => line.startsWith("# Author:"))
    ?.substring(9)
    .trim() || "Unknown";
  
  const description = lines
    .find((line) => line.startsWith("# Description:"))
    ?.substring(14)
    .trim() || "";
  
  // Parse nodes
  const nodes: StoryNode[] = [];
  let currentId = "";
  let currentType: "video" | "ending" | "start" = "video";
  let currentSubtitle = "";
  let currentChoices: Choice[] = [];
  
  const flushNode = () => {
    if (!currentId) return;
    
    nodes.push({
      id: currentId,
      title: currentId
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase()),
      type: currentType,
      videoFile: `${currentId}.mp4`,
      subtitle: currentSubtitle || undefined,
      choices: currentChoices,
    });
    
    currentChoices = [];
    currentSubtitle = "";
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Node declaration: ## node:id:type
    if (trimmed.startsWith("## node:")) {
      flushNode();
      const nodeMeta = trimmed.substring(8).split(":");
      currentId = nodeMeta[0]?.trim() || "";
      const typeValue = nodeMeta[1]?.trim();
      currentType = (typeValue === "start" || typeValue === "ending" || typeValue === "video") 
        ? typeValue 
        : "video";
    }
    // Choice: -> id | label | target
    else if (trimmed.startsWith("-> ")) {
      const choiceText = trimmed.substring(3);
      const segments = choiceText.split("|").map((s) => s.trim());
      const id = segments[0] || "";
      const label = segments[1] || "";
      const target = segments[2] || "";
      
      if (id && label && target) {
        currentChoices.push({
          id,
          label,
          targetNodeId: target,
        });
      }
    }
    // Subtitle text (non-empty, not a directive)
    else if (trimmed && !trimmed.startsWith("#")) {
      currentSubtitle = currentSubtitle 
        ? `${currentSubtitle} ${trimmed}` 
        : trimmed;
    }
  }
  
  flushNode();
  
  // Determine start node
  const startNodeId = nodes.find((n) => n.type === "start")?.id 
    || nodes[0]?.id 
    || "intro";
  
  const meta: StoryMeta = {
    title,
    description,
    author,
    version: "1.0.0",
    date: new Date().toISOString().split("T")[0],
  };
  
  const config: StoryConfig = {
    videoBasePath: "videos",
    preloadNext: true,
    defaultVolume: 1.0,
  };
  
  return {
    meta,
    config,
    startNodeId,
    nodes,
  };
}

/**
 * Convert a StoryDefinition back to markdown format.
 * Useful for editing existing stories.
 */
export function storyToMarkdown(story: StoryDefinition): string {
  const lines: string[] = [];
  
  // Metadata
  lines.push(`# Title: ${story.meta.title}`);
  lines.push(`# Author: ${story.meta.author}`);
  if (story.meta.description) {
    lines.push(`# Description: ${story.meta.description}`);
  }
  lines.push("");
  
  // Nodes
  for (const node of story.nodes) {
    lines.push(`## node:${node.id}:${node.type}`);
    
    if (node.subtitle) {
      lines.push(node.subtitle);
    }
    
    for (const choice of node.choices) {
      lines.push(`-> ${choice.id} | ${choice.label} | ${choice.targetNodeId}`);
    }
    
    lines.push("");
  }
  
  return lines.join("\n");
}

/**
 * Validate markdown story format.
 * Returns array of error messages, empty if valid.
 */
export function validateMarkdownStory(input: string): string[] {
  const errors: string[] = [];
  const lines = input.split("\n");
  
  // Check for required metadata
  if (!lines.some((line) => line.startsWith("# Title:"))) {
    errors.push("Missing required field: # Title:");
  }
  
  if (!lines.some((line) => line.startsWith("# Author:"))) {
    errors.push("Missing required field: # Author:");
  }
  
  // Check for nodes
  const nodeLines = lines.filter((line) => line.trim().startsWith("## node:"));
  if (nodeLines.length === 0) {
    errors.push("No nodes defined. Use '## node:id:type' syntax.");
  }
  
  // Check node syntax
  for (const line of nodeLines) {
    const parts = line.trim().substring(8).split(":");
    if (parts.length < 2) {
      errors.push(`Invalid node syntax: ${line.trim()}`);
    }
  }
  
  // Check for orphaned choices (choices before any node)
  let foundNode = false;
  for (const line of lines) {
    if (line.trim().startsWith("## node:")) {
      foundNode = true;
    } else if (line.trim().startsWith("-> ") && !foundNode) {
      errors.push("Choice found before any node definition");
      break;
    }
  }
  
  return errors;
}
