/**
 * Story Schema Type Definitions
 *
 * These types define the complete data model for an interactive video story.
 * A story is a directed graph where nodes are video scenes and edges are
 * user choices that connect scenes.
 *
 * ## Naming Convention for Video Files
 *
 * Video files follow this naming schema:
 *   {nodeId}.{extension}
 *
 * Examples:
 *   intro.mp4
 *   chapter1_choice_a.webm
 *   ending_good.mp4
 *
 * The `videoFile` field in each StoryNode references the filename relative
 * to the story's video directory.
 */

// ---------------------------------------------------------------------------
// Core Node Types
// ---------------------------------------------------------------------------

/** A single choice presented to the user at the end of a video node. */
export interface Choice {
  /** Unique identifier for this choice within its parent node. */
  id: string;

  /** Display text shown to the user (e.g., "Open the door"). */
  label: string;

  /** The `id` of the StoryNode this choice navigates to. */
  targetNodeId: string;

  /**
   * Optional timestamp (in seconds) at which this choice becomes visible.
   * If omitted, the choice appears when the video ends.
   */
  showAtTime?: number;

  /**
   * Optional condition key. If set, the choice is only shown when
   * this key exists in the player's state flags.
   * Reserved for future implementation.
   */
  condition?: string;
}

/** Defines when choices should appear relative to video playback. */
export type ChoiceTiming =
  | "on_end"       // Choices appear after video finishes (default)
  | "during_video" // Choices appear at specified timestamps
  | "on_pause";    // Choices appear when user pauses

/** The type of a story node, determining its behavior. */
export type NodeType =
  | "video"    // Standard video node with choices
  | "ending"   // Terminal node — story ends here
  | "start";   // Entry point — the first node played

/** Configuration for video transitions between nodes. */
export interface Transition {
  type: "cut" | "crossfade" | "fade-black" | "fade-white";
  durationMs?: number; // default 500
}

/** A single node in the story graph. */
export interface StoryNode {
  /** Unique identifier for this node. Used as lookup key and in file naming. */
  id: string;

  /** Human-readable title shown in the UI (e.g., "The Dark Forest"). */
  title: string;

  /** The type of this node. */
  type: NodeType;

  /**
   * Video filename relative to the story's video directory.
   * Follows naming convention: {nodeId}.{ext}
   * Example: "intro.mp4"
   */
  videoFile: string;

  /**
   * Array of choices available to the user.
   * Empty for "ending" type nodes.
   */
  choices: Choice[];

  /** When choices should be displayed. Defaults to "on_end". */
  choiceTiming?: ChoiceTiming;

  /**
   * Optional subtitle/description text displayed below the video
   * while it plays.
   */
  subtitle?: string;

  /**
   * Optional background color or CSS class applied during this node.
   * Useful for thematic transitions.
   */
  theme?: string;

  /**
   * Optional transition effect to use when navigating to the next node.
   * If omitted, uses the story's defaultTransition or "cut".
   */
  transition?: Transition;

  /**
   * Optional flag keys to set when this node is visited.
   * Reserved for future conditional branching.
   */
  setsFlags?: string[];
}

// ---------------------------------------------------------------------------
// Story Metadata
// ---------------------------------------------------------------------------

/** Metadata about the story for display and cataloging. */
export interface StoryMeta {
  /** Optional unique identifier for this story. */
  id?: string;

  /** Display title of the story. */
  title: string;

  /** Short description / tagline. */
  description: string;

  /** Author or creator name. */
  author: string;

  /** Version string (SemVer recommended). */
  version: string;

  /** ISO date string of creation or last update. */
  date: string;

  /** Optional thumbnail image filename. */
  thumbnail?: string;

  /** Optional estimated duration in minutes. */
  estimatedMinutes?: number;

  /** Optional content tags for categorization. */
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Story Configuration
// ---------------------------------------------------------------------------

/** Configuration options that affect playback behavior. */
export interface StoryConfig {
  /**
   * Base path to the video files directory, relative to the public root.
   * Example: "/stories/sample/videos"
   */
  videoBasePath: string;

  /**
   * Whether to preload the next set of possible videos.
   * Improves transition smoothness at the cost of bandwidth.
   * Default: true
   */
  preloadNext?: boolean;

  /**
   * Default volume level (0.0 to 1.0).
   * Default: 1.0
   */
  defaultVolume?: number;

  /**
   * Whether to allow the user to restart from any previously
   * visited node. Default: false. Reserved for future implementation.
   */
  allowRevisit?: boolean;

  /**
   * Seconds before video end to begin showing choices.
   * Only applies when choiceTiming is "on_end".
   * Default: 0 (show exactly when video ends).
   */
  choiceLeadTime?: number;

  /**
   * Default transition effect for all nodes.
   * Individual nodes can override with their own transition setting.
   * Default: { type: "cut" }
   */
  defaultTransition?: Transition;
}

// ---------------------------------------------------------------------------
// Top-Level Story Definition
// ---------------------------------------------------------------------------

/**
 * The complete story definition loaded from a JSON file.
 *
 * Example file: public/stories/sample/story.json
 */
export interface StoryDefinition {
  /** Story metadata. */
  meta: StoryMeta;

  /** Playback and asset configuration. */
  config: StoryConfig;

  /**
   * The ID of the starting node. Must reference a node with type "start".
   */
  startNodeId: string;

  /**
   * All nodes in the story graph, keyed by node ID for O(1) lookup.
   * The JSON file provides an array; the engine converts to a Map at load.
   */
  nodes: StoryNode[];
}

// ---------------------------------------------------------------------------
// Runtime State (used by the engine, not stored in JSON)
// ---------------------------------------------------------------------------

/** Represents the current playback state of the story engine. */
export type PlaybackPhase =
  | "loading"      // Story JSON is being fetched
  | "start_screen" // Showing the title/start screen
  | "playing"      // A video is actively playing
  | "choosing"     // Video ended, awaiting user choice
  | "transitioning"// Fade/transition between nodes
  | "ended"        // Reached an ending node
  | "error";       // Something went wrong

/** A record of a node visit in the player's history. */
export interface HistoryEntry {
  /** The node ID that was visited. */
  nodeId: string;

  /** The choice ID that was selected to leave this node (if any). */
  choiceId?: string;

  /** Timestamp of when this node was visited. */
  timestamp: number;
}

/** Complete runtime state of the story engine. */
export interface StoryState {
  /** Current playback phase. */
  phase: PlaybackPhase;

  /** The currently active node, or null if not yet started. */
  currentNode: StoryNode | null;

  /** Ordered history of all visited nodes. */
  history: HistoryEntry[];

  /** Set of flag keys accumulated during play. */
  flags: Set<string>;

  /** Error message if phase is "error". */
  error?: string;
}
