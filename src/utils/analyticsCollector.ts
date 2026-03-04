import type { StoryAnalytics, PlaythroughRecord } from "../types/analytics";

const STORAGE_PREFIX = "cyoa-analytics";

class AnalyticsCollector {
  private getStorageKey(storyKey: string): string {
    return `${STORAGE_PREFIX}:${storyKey}`;
  }

  private loadAnalytics(storyKey: string): StoryAnalytics {
    try {
      const raw = localStorage.getItem(this.getStorageKey(storyKey));
      if (!raw) {
        return this.createEmptyAnalytics(storyKey);
      }
      return JSON.parse(raw) as StoryAnalytics;
    } catch {
      return this.createEmptyAnalytics(storyKey);
    }
  }

  private saveAnalytics(storyKey: string, analytics: StoryAnalytics): void {
    try {
      localStorage.setItem(this.getStorageKey(storyKey), JSON.stringify(analytics));
    } catch (e) {
      console.warn("[AnalyticsCollector] Failed to save analytics:", e);
    }
  }

  private createEmptyAnalytics(storyKey: string): StoryAnalytics {
    return {
      storyKey,
      totalPlaythroughs: 0,
      choiceCounts: {},
      endingCounts: {},
      playthroughs: [],
    };
  }

  getAnalytics(storyKey: string): StoryAnalytics {
    return this.loadAnalytics(storyKey);
  }

  recordChoice(storyKey: string, nodeId: string, choiceId: string): void {
    const analytics = this.loadAnalytics(storyKey);
    
    if (!analytics.choiceCounts[nodeId]) {
      analytics.choiceCounts[nodeId] = {};
    }
    if (!analytics.choiceCounts[nodeId][choiceId]) {
      analytics.choiceCounts[nodeId][choiceId] = 0;
    }
    analytics.choiceCounts[nodeId][choiceId]++;
    
    this.saveAnalytics(storyKey, analytics);
  }

  recordPlaythrough(
    storyKey: string,
    path: string[],
    endingNodeId: string,
    startedAt: number
  ): void {
    const analytics = this.loadAnalytics(storyKey);
    
    const record: PlaythroughRecord = {
      storyKey,
      path,
      endingNodeId,
      startedAt,
      endedAt: Date.now(),
    };
    
    analytics.playthroughs.push(record);
    analytics.totalPlaythroughs++;
    
    if (!analytics.endingCounts[endingNodeId]) {
      analytics.endingCounts[endingNodeId] = 0;
    }
    analytics.endingCounts[endingNodeId]++;
    
    this.saveAnalytics(storyKey, analytics);
  }

  clearAnalytics(storyKey: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(storyKey));
    } catch (e) {
      console.warn("[AnalyticsCollector] Failed to clear analytics:", e);
    }
  }

  getChoiceStats(
    analytics: StoryAnalytics,
    nodeId: string
  ): Array<{ choiceId: string; count: number; percentage: number }> {
    const nodeCounts = analytics.choiceCounts[nodeId];
    if (!nodeCounts) return [];
    
    const total = Object.values(nodeCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    
    return Object.entries(nodeCounts).map(([choiceId, count]) => ({
      choiceId,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }

  getEndingStats(
    analytics: StoryAnalytics
  ): Array<{ endingNodeId: string; count: number; percentage: number }> {
    const total = analytics.totalPlaythroughs;
    if (total === 0) return [];
    
    return Object.entries(analytics.endingCounts).map(([endingNodeId, count]) => ({
      endingNodeId,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }
}

export const analyticsCollector = new AnalyticsCollector();
