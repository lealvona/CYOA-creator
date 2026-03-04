/**
 * StoryEngine — The core state machine that drives story navigation.
 *
 * Responsibilities:
 *  - Load and index a StoryDefinition from JSON.
 *  - Maintain current playback state (phase, current node, history, flags).
 *  - Expose navigation methods: start, choose, restart, goBack.
 *  - Emit state change callbacks so React can re-render.
 *
 * This class is framework-agnostic; the React integration layer is in
 * hooks/useStoryEngine.ts.
 */

import type {
  StoryDefinition,
  StoryNode,
  StoryState,
  PlaybackPhase,
  HistoryEntry,
  Choice,
  StoryConfig,
  StoryMeta,
} from "../types/story";
import { assertStoryValid } from "../utils/validateStory";

// ---------------------------------------------------------------------------
// Event system
// ---------------------------------------------------------------------------

export type StoryEventType =
  | "stateChange"
  | "nodeEnter"
  | "nodeExit"
  | "choiceMade"
  | "storyEnd"
  | "error"
  | "progressLoaded";

export interface StoryEvent {
  type: StoryEventType;
  state: StoryState;
  payload?: unknown;
}

export type StoryEventListener = (event: StoryEvent) => void;

export interface StoryProgressSnapshot {
  storyKey: string;
  currentNodeId: string;
  history: HistoryEntry[];
  flags: string[];
  phase: PlaybackPhase;
  timestamp: number;
  schemaVersion?: number;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class StoryEngine {
  // Indexed node map for O(1) lookup
  private nodeMap: Map<string, StoryNode> = new Map();

  // Story definition data
  private _meta: StoryMeta | null = null;
  private _config: StoryConfig | null = null;
  private startNodeId: string = "";

  // Runtime state
  private _state: StoryState = {
    phase: "loading",
    currentNode: null,
    history: [],
    flags: new Set(),
  };

  // Listeners
  private listeners: Map<StoryEventType, Set<StoryEventListener>> = new Map();

  // ---------- Getters ----------

  get state(): Readonly<StoryState> {
    return this._state;
  }

  get meta(): Readonly<StoryMeta> | null {
    return this._meta;
  }

  get config(): Readonly<StoryConfig> | null {
    return this._config;
  }

  get currentNode(): StoryNode | null {
    return this._state.currentNode;
  }

  get phase(): PlaybackPhase {
    return this._state.phase;
  }

  get history(): readonly HistoryEntry[] {
    return this._state.history;
  }

  get isLoaded(): boolean {
    return this.nodeMap.size > 0;
  }

  get totalNodes(): number {
    return this.nodeMap.size;
  }

  get storyKey(): string {
    if (!this._meta) return "";
    const key = this._meta.id ?? this._meta.title;
    return `${key}::${this._meta.version}`;
  }

  // ---------- Event Emitter ----------

  on(type: StoryEventType, listener: StoryEventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  private emit(type: StoryEventType, payload?: unknown): void {
    const event: StoryEvent = { type, state: { ...this._state }, payload };

    this.listeners.get(type)?.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error(`[StoryEngine] Listener error on "${type}":`, err);
      }
    });

    // Always emit stateChange for any event type (React hook listens here)
    if (type !== "stateChange") {
      this.listeners.get("stateChange")?.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[StoryEngine] stateChange listener error:`, err);
        }
      });
    }
  }

  // ---------- Load ----------

  /**
   * Load a story definition. Can accept either a parsed object or a URL
   * to fetch from.
   */
  async load(source: StoryDefinition | string): Promise<void> {
    this.setPhase("loading");

    try {
      let definition: StoryDefinition;

      if (typeof source === "string") {
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch story: ${response.status} ${response.statusText}`
          );
        }
        definition = (await response.json()) as StoryDefinition;
      } else {
        definition = source;
      }

      // Validate and index
      assertStoryValid(definition);
      this.index(definition);
      this.setPhase("start_screen");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error loading story";
      this._state.error = message;
      this.setPhase("error");
      this.emit("error", { message });
    }
  }

  /** Build the internal node map from a StoryDefinition. */
  private index(definition: StoryDefinition): void {
    this._meta = definition.meta;
    this._config = definition.config;
    this.startNodeId = definition.startNodeId;

    this.nodeMap.clear();
    for (const node of definition.nodes) {
      if (this.nodeMap.has(node.id)) {
        console.warn(
          `[StoryEngine] Duplicate node ID "${node.id}" — later definition wins.`
        );
      }
      this.nodeMap.set(node.id, node);
    }

    // Validate start node exists
    if (!this.nodeMap.has(this.startNodeId)) {
      throw new Error(
        `Start node "${this.startNodeId}" not found in story nodes.`
      );
    }
  }

  // ---------- Navigation ----------

  /** Begin the story from the start node. */
  start(): void {
    if (!this.isLoaded) {
      this.setPhase("error");
      this._state.error = "Cannot start: no story loaded.";
      this.emit("error", { message: this._state.error });
      return;
    }

    // Reset state
    this._state.history = [];
    this._state.flags = new Set();

    this.enterNode(this.startNodeId);
  }

  /**
   * Process a user choice by ID. Navigates to the target node.
   * Returns false if the choice is invalid.
   */
  choose(choiceId: string): boolean {
    const current = this._state.currentNode;
    if (!current) return false;

    const choice = current.choices.find((c) => c.id === choiceId);
    if (!choice) {
      console.warn(
        `[StoryEngine] Choice "${choiceId}" not found on node "${current.id}".`
      );
      return false;
    }

    // Check condition (future: evaluate against flags)
    if (choice.condition && !this._state.flags.has(choice.condition)) {
      console.warn(
        `[StoryEngine] Choice "${choiceId}" condition "${choice.condition}" not met.`
      );
      return false;
    }

    // Record the choice in history
    const lastEntry = this._state.history[this._state.history.length - 1];
    if (lastEntry && lastEntry.nodeId === current.id) {
      lastEntry.choiceId = choiceId;
    }

    this.emit("choiceMade", { choice, fromNode: current.id });

    // Transition
    this.setPhase("transitioning");
    this.enterNode(choice.targetNodeId);

    return true;
  }

  /** Signal that the current video has finished playing. */
  videoEnded(): void {
    if (this._state.phase !== "playing") return;

    const node = this._state.currentNode;
    if (!node) return;

    if (node.type === "ending" || node.choices.length === 0) {
      this.setPhase("ended");
      this.emit("storyEnd", { endingNode: node });
    } else {
      this.setPhase("choosing");
    }
  }

  /** Go back to the previous node in history. */
  goBack(): boolean {
    if (!this._config?.allowRevisit) {
      return false;
    }

    if (this._state.history.length < 2) return false;

    // Remove current entry
    this._state.history.pop();

    // Get previous entry
    const prev = this._state.history[this._state.history.length - 1];
    const node = this.nodeMap.get(prev.nodeId);

    if (!node) return false;

    this._state.currentNode = node;
    this.setPhase("playing");
    this.emit("nodeEnter", { node });

    return true;
  }

  /** Restart the story from the beginning. */
  restart(): void {
    this.start();
  }

  // ---------- Node Resolution ----------

  /** Get a node by ID. Useful for preloading. */
  getNode(nodeId: string): StoryNode | undefined {
    return this.nodeMap.get(nodeId);
  }

  /** Get all possible next nodes from the current node. */
  getNextNodes(): StoryNode[] {
    const current = this._state.currentNode;
    if (!current) return [];

    return current.choices
      .map((c) => this.nodeMap.get(c.targetNodeId))
      .filter((n): n is StoryNode => n !== undefined);
  }

  /** Get the full video URL for a node. */
  getVideoUrl(node: StoryNode): string {
    const basePath = this._config?.videoBasePath ?? "/videos";
    // Ensure no double slashes
    const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    return `${base}/${node.videoFile}`;
  }

  /**
   * Get available choices for the current node, filtered by conditions.
   */
  getAvailableChoices(): Choice[] {
    const current = this._state.currentNode;
    if (!current) return [];

    return current.choices.filter((c) => {
      if (!c.condition) return true;
      return this._state.flags.has(c.condition);
    });
  }

  createProgressSnapshot(): StoryProgressSnapshot | null {
    if (!this._state.currentNode || !this._meta) return null;

    return {
      storyKey: this.storyKey,
      currentNodeId: this._state.currentNode.id,
      history: this._state.history.map((item) => ({ ...item })),
      flags: Array.from(this._state.flags),
      phase: this._state.phase,
      timestamp: Date.now(),
      schemaVersion: 1,
    };
  }

  loadProgressSnapshot(snapshot: StoryProgressSnapshot): boolean {
    if (!this.isLoaded) return false;
    if (snapshot.storyKey !== this.storyKey) return false;

    const currentNode = this.nodeMap.get(snapshot.currentNodeId);
    if (!currentNode) return false;

    const validHistory = snapshot.history.filter((entry) =>
      this.nodeMap.has(entry.nodeId)
    );

    this._state.currentNode = currentNode;
    this._state.history =
      validHistory.length > 0
        ? validHistory.map((entry) => ({ ...entry }))
        : [{ nodeId: currentNode.id, timestamp: Date.now() }];
    this._state.flags = new Set(snapshot.flags);
    this._state.error = undefined;

    if (currentNode.type === "ending") {
      this._state.phase = "ended";
    } else if (snapshot.phase === "choosing") {
      this._state.phase = "choosing";
    } else {
      this._state.phase = "playing";
    }

    this.emit("progressLoaded", { snapshot });
    this.emit("stateChange");
    return true;
  }

  // ---------- Internal ----------

  private enterNode(nodeId: string): void {
    const node = this.nodeMap.get(nodeId);
    if (!node) {
      this._state.error = `Node "${nodeId}" not found.`;
      this.setPhase("error");
      this.emit("error", { message: this._state.error });
      return;
    }

    // Exit previous node
    if (this._state.currentNode) {
      this.emit("nodeExit", { node: this._state.currentNode });
    }

    // Set flags
    if (node.setsFlags) {
      for (const flag of node.setsFlags) {
        this._state.flags.add(flag);
      }
    }

    // Update state
    this._state.currentNode = node;
    this._state.history.push({
      nodeId: node.id,
      timestamp: Date.now(),
    });

    this.setPhase("playing");
    this.emit("nodeEnter", { node });
  }

  private setPhase(phase: PlaybackPhase): void {
    this._state.phase = phase;
    this.emit("stateChange");
  }
}
