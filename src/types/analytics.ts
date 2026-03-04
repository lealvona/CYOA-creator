export interface ChoiceEvent {
  storyKey: string;
  nodeId: string;
  choiceId: string;
  timestamp: number;
}

export interface PlaythroughRecord {
  storyKey: string;
  path: string[];
  endingNodeId: string;
  startedAt: number;
  endedAt: number;
}

export interface StoryAnalytics {
  storyKey: string;
  totalPlaythroughs: number;
  choiceCounts: Record<string, Record<string, number>>;
  endingCounts: Record<string, number>;
  playthroughs: PlaythroughRecord[];
}
